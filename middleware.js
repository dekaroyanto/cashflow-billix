// middleware.js (di root folder, sejajar dengan folder app)
import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Daftar path yang diizinkan tanpa PIN
  const publicPaths = [
    "/pin",
    "/manifest.json",
    "/sw.js", // Service worker jika ada
    "/icons/", // Folder icons
  ];

  // Cek apakah path termasuk public
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path),
  );

  // Cek apakah file statis (gambar, css, js, dll)
  const isStaticFile =
    /\.(ico|png|jpg|jpeg|svg|json|js|css|woff|woff2|ttf|eot)$/.test(pathname);

  // Jika path public atau file statis, izinkan akses
  if (isPublicPath || isStaticFile) {
    return NextResponse.next();
  }

  // Ambil cookie
  const pinVerified = request.cookies.get("pin_verified");
  const pinTime = request.cookies.get("pin_time");

  // Jika tidak ada cookie PIN atau belum verified
  if (!pinVerified || pinVerified.value !== "true") {
    const url = request.nextUrl.clone();
    url.pathname = "/pin";
    // Simpan URL asli untuk redirect setelah login
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // Cek waktu sesi (5 menit = 300 detik)
  if (pinTime) {
    const currentTime = Date.now();
    const verifiedTime = parseInt(pinTime.value);
    const timeDiff = (currentTime - verifiedTime) / 1000;

    if (timeDiff > 300) {
      // Sesi expired
      const response = NextResponse.redirect(new URL("/pin", request.url));
      response.cookies.delete("pin_verified");
      response.cookies.delete("pin_time");
      return response;
    }
  }

  return NextResponse.next();
}

// Konfigurasi middleware untuk semua route kecuali _next
export const config = {
  matcher: [
    /*
     * Match semua request paths kecuali:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
