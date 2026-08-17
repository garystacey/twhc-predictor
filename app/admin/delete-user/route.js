import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabaseSecretKey =
  process.env.SUPABASE_SECRET_KEY;

export async function POST(request) {
  try {
    if (
      !supabaseUrl ||
      !supabasePublishableKey ||
      !supabaseSecretKey
    ) {
      return Response.json(
        {
          error: "Server configuration is incomplete.",
        },
        {
          status: 500,
        }
      );
    }

    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return Response.json(
        {
          error: "Not authorised.",
        },
        {
          status: 401,
        }
      );
    }

    const accessToken = authHeader.replace("Bearer ", "");

    const {
      userId,
    } = await request.json();

    if (!userId) {
      return Response.json(
        {
          error: "No member was selected.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      Normal client:
      used only to validate the currently signed-in user's token.
    */
    const authClient = createClient(
      supabaseUrl,
      supabasePublishableKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const {
      data: {
        user: requestingUser,
      },
      error: requestingUserError,
    } = await authClient.auth.getUser(accessToken);

    if (
      requestingUserError ||
      !requestingUser
    ) {
      return Response.json(
        {
          error: "Your login session is invalid or has expired.",
        },
        {
          status: 401,
        }
      );
    }

    /*
      Prevent an administrator from deleting their own
      currently logged-in account.
    */
    if (requestingUser.id === userId) {
      return Response.json(
        {
          error: "You cannot delete your own Admin account.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      Server-only privileged client.
      SUPABASE_SECRET_KEY must never be exposed in browser code.
    */
    const adminClient = createClient(
      supabaseUrl,
      supabaseSecretKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    /*
      Confirm that the person making the request
      is actually an Admin.
    */
    const {
      data: adminProfile,
      error: adminProfileError,
    } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", requestingUser.id)
      .single();

    if (
      adminProfileError ||
      !adminProfile ||
      adminProfile.role !== "admin"
    ) {
      return Response.json(
        {
          error: "You do not have permission to delete members.",
        },
        {
          status: 403,
        }
      );
    }

    /*
      Make sure the target member exists.
    */
    const {
      data: targetProfile,
      error: targetProfileError,
    } = await adminClient
      .from("profiles")
      .select("id, first_name, surname, team_name")
      .eq("id", userId)
      .single();

    if (
      targetProfileError ||
      !targetProfile
    ) {
      return Response.json(
        {
          error: "Member not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
      Delete all Predictor entries belonging to the member.
    */
    const {
      error: predictionsError,
    } = await adminClient
      .from("predictions")
      .delete()
      .eq("user_id", userId);

    if (predictionsError) {
      return Response.json(
        {
          error: "Could not delete the member's predictions.",
        },
        {
          status: 500,
        }
      );
    }

    /*
      Delete their Predictor profile.
    */
    const {
      error: profileDeleteError,
    } = await adminClient
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileDeleteError) {
      return Response.json(
        {
          error: "Could not delete the member profile.",
        },
        {
          status: 500,
        }
      );
    }

    /*
      Finally delete the Supabase Auth account.
    */
    const {
      error: authDeleteError,
    } = await adminClient.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      return Response.json(
        {
          error:
            "The Predictor data was removed, but the login account could not be deleted.",
        },
        {
          status: 500,
        }
      );
    }

    return Response.json({
      success: true,
      deletedMember: {
        id: targetProfile.id,
        firstName:
          targetProfile.first_name || "",
        surname:
          targetProfile.surname || "",
        teamName:
          targetProfile.team_name || "",
      },
    });
  } catch (error) {
    console.error("Delete member error:", error);

    return Response.json(
      {
        error: "An unexpected error occurred while deleting the member.",
      },
      {
        status: 500,
      }
    );
  }
}
