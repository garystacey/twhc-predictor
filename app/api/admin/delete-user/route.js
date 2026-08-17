import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

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
          error:
            "Server configuration is incomplete.",
        },
        {
          status: 500,
        }
      );
    }

    const authHeader =
      request.headers.get("authorization");

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return Response.json(
        {
          error: "Not authorised.",
        },
        {
          status: 401,
        }
      );
    }

    const accessToken =
      authHeader.replace("Bearer ", "");

    const { userId } = await request.json();

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
      Create a normal Supabase client using the
      signed-in Admin user's access token.
    */
    const userClient = createClient(
      supabaseUrl,
      supabasePublishableKey,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    /*
      Validate the supplied login token.
    */
    const {
      data: { user: requestingUser },
      error: requestingUserError,
    } = await userClient.auth.getUser(
      accessToken
    );

    if (
      requestingUserError ||
      !requestingUser
    ) {
      return Response.json(
        {
          error:
            "Your login session is invalid or has expired.",
        },
        {
          status: 401,
        }
      );
    }

    /*
      Prevent the current Admin deleting themselves.
    */
    if (requestingUser.id === userId) {
      return Response.json(
        {
          error:
            "You cannot delete your own Admin account.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      Check the signed-in user's role using their
      own authenticated session.
    */
    const {
      data: adminProfile,
      error: adminProfileError,
    } = await userClient
      .from("profiles")
      .select("role")
      .eq("id", requestingUser.id)
      .single();

    if (adminProfileError) {
      return Response.json(
        {
          error:
            `Could not verify Admin role: ${adminProfileError.message}`,
        },
        {
          status: 403,
        }
      );
    }

    if (
      !adminProfile ||
      adminProfile.role !== "admin"
    ) {
      return Response.json(
        {
          error:
            "You do not have permission to delete members.",
        },
        {
          status: 403,
        }
      );
    }

    /*
      Now create the privileged SERVER-ONLY client.
      This key must never be exposed in browser code.
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
      Make sure the member exists before deleting.
    */
    const {
      data: targetProfile,
      error: targetProfileError,
    } = await adminClient
      .from("profiles")
      .select(
        "id, first_name, surname, team_name"
      )
      .eq("id", userId)
      .single();

    if (targetProfileError) {
      return Response.json(
        {
          error:
            `Could not find member: ${targetProfileError.message}`,
        },
        {
          status: 500,
        }
      );
    }

    if (!targetProfile) {
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
      Delete all of their Predictor predictions.
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
          error:
            `Could not delete predictions: ${predictionsError.message}`,
        },
        {
          status: 500,
        }
      );
    }

    /*
      Delete the public Predictor profile.
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
          error:
            `Could not delete member profile: ${profileDeleteError.message}`,
        },
        {
          status: 500,
        }
      );
    }

    /*
      Finally remove their Supabase Auth login.
    */
    const {
      error: authDeleteError,
    } =
      await adminClient.auth.admin.deleteUser(
        userId
      );

    if (authDeleteError) {
      return Response.json(
        {
          error:
            `Predictor data was removed, but the login account could not be deleted: ${authDeleteError.message}`,
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
    console.error(
      "Delete member error:",
      error
    );

    return Response.json(
      {
        error:
          "An unexpected error occurred while deleting the member.",
      },
      {
        status: 500,
      }
    );
  }
}
