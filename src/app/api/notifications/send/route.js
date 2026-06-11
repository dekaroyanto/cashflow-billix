import webpush from "web-push";
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

// Setup VAPID keys
webpush.setVapidDetails(
  process.env.NEXT_PUBLIC_APP_URL || "https://cashflow-billix.vercel.app",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

export async function POST(request) {
  try {
    const { title, body, type, url } = await request.json();

    // Ambil semua subscription (tanpa filter user_id)
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("*");

    if (error) throw error;

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Tidak ada subscription aktif",
        sent: 0,
      });
    }

    // Kirim notifikasi ke semua subscription
    const results = [];
    for (const sub of subscriptions) {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: sub.keys,
      };

      const payload = JSON.stringify({
        title: title || "CashFlow Billix",
        body: body || "",
        type: type || "info",
        url: url || "/",
        badge: "/icons/badge-72x72.png",
      });

      try {
        await webpush.sendNotification(pushSubscription, payload);
        results.push({
          endpoint: sub.endpoint.substring(0, 50) + "...",
          success: true,
        });
      } catch (error) {
        console.error("Failed to send to:", sub.endpoint, error);
        results.push({
          endpoint: sub.endpoint.substring(0, 50) + "...",
          success: false,
        });

        // Hapus subscription yang expired/invalid (status 410)
        if (error.statusCode === 410) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", sub.endpoint);
        }
      }
    }

    return NextResponse.json({
      success: true,
      sent: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      total: subscriptions.length,
      results,
    });
  } catch (error) {
    console.error("Error sending notifications:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
