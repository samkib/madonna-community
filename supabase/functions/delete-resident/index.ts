/*
  Edge Function: delete-resident
  - Expected invocation payload:
      supabase.functions.invoke('delete-resident', { body: { user_id } })
*/

import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  console.log("Delete function called");

  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      console.log("Missing Authorization header");
      return jsonResponse({ error: "Missing Authorization header." }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      console.log("Missing env vars");
      return jsonResponse(
        {
          error:
            "Missing Supabase env vars (SUPABASE_URL/SUPABASE_ANON_KEY/SUPABASE_SERVICE_ROLE_KEY).",
        },
        500
      );
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const {
      data: { user: caller },
      error: callerError,
    } = await callerClient.auth.getUser();

    if (callerError || !caller) {
      console.log("Not authenticated", callerError);
      return jsonResponse({ error: "Not authenticated." }, 401);
    }

    const {
      data: callerProfile,
      error: profileError,
    } = await callerClient
      .from("profiles")
      .select("role")
      .eq("id", caller.id)
      .single();

    console.log("Caller profile:", {
      callerId: caller.id,
      role: callerProfile?.role,
    });

    if (
      profileError ||
      !["chairperson", "landlady"].includes(callerProfile?.role)
    ) {
      return jsonResponse(
        {
          error:
            "Only the chairperson or landlady can remove residents.",
        },
        403
      );
    }

    const body = await req.json();
    console.log("Received body:", body);

    const user_id = body?.user_id;

    console.log("Deleting:", user_id);

    if (!user_id) {
      return jsonResponse({ error: "user_id is required." }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // If you have an RPC named remove_resident, call it.
    // Expected args:
    //   p_resident_id: user_id
    //
    // NOTE: adminClient.rpc(...) returns a PostgrestBuilder, which only
    // implements .then() — it is NOT a real Promise, so chaining .catch()
    // on it directly throws a TypeError ("...catch is not a function").
    // That threw exception was landing in the outer catch block and
    // returning an unhelpful bare 500. Just await it — supabase-js
    // resolves with { data, error } on failure, it doesn't throw.
    const { error: rpcError } = await adminClient.rpc("remove_resident", {
      p_resident_id: user_id,
    });

    if (rpcError) {
      console.log("remove_resident rpc error:", rpcError);
      return jsonResponse(
        { error: rpcError.message || "remove_resident rpc failed." },
        400
      );
    }

    const { error: deleteAuthError } =
      await adminClient.auth.admin.deleteUser(user_id);

    if (deleteAuthError) {
      console.log("deleteUser error:", deleteAuthError);
      return jsonResponse({ error: deleteAuthError.message }, 400);
    }

    return jsonResponse({ success: true });
  } catch (err: unknown) {
    console.log("Unexpected error:", err);
    return jsonResponse(
      {
        error:
          err instanceof Error ? err.message : "Unexpected error.",
      },
      500
    );
  }
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}