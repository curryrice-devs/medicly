import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

type UserRole = "client" | "doctor" | "admin";

interface RouteConfig {
  pattern: RegExp;
  allowedRoles: UserRole[];
  redirectPath?: string;
}

const ROUTE_CONFIGS: RouteConfig[] = [
  {
    pattern: /^\/dashboard\/patient/,
    allowedRoles: ["client"],
  },
  {
    pattern: /^\/dashboard\/doctor/,
    allowedRoles: ["doctor"],
    redirectPath: "/dashboard",
  },
  {
    pattern: /^\/dashboard\/admin/,
    allowedRoles: ["admin"],
    redirectPath: "/dashboard",
  },
  {
    pattern: /^\/dashboard$/,
    allowedRoles: ["client", "doctor", "admin"],
  },
  // Legacy routes for backward compatibility
  {
    pattern: /^\/client/,
    allowedRoles: ["client"],
    redirectPath: "/dashboard/patient",
  },
  {
    pattern: /^\/patient/,
    allowedRoles: ["client"],
    redirectPath: "/dashboard/patient",
  },
  {
    pattern: /^\/doctor/,
    allowedRoles: ["doctor"],
    redirectPath: "/dashboard/doctor",
  },
];

const PUBLIC_ROUTES = [
  /^\/$/,
  /^\/signup/,
  /^\/welcome/,
  /^\/auth\//,
  /^\/_next\//,
  /^\/api\/auth\//,
  /^\/favicon/,
  /^\/.*\.(png|jpg|jpeg|gif|svg|ico)$/,
];

const ALWAYS_ACCESSIBLE_ROUTES = [
  /^\/$/,  // Home page accessible to both authenticated and non-authenticated users
];

function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some(pattern => pattern.test(path));
}

function isAlwaysAccessibleRoute(path: string): boolean {
  return ALWAYS_ACCESSIBLE_ROUTES.some(pattern => pattern.test(path));
}

function findRouteConfig(path: string): RouteConfig | null {
  return ROUTE_CONFIGS.find(config => config.pattern.test(path)) || null;
}

function getRedirectPathForRole(role: UserRole): string {
  switch (role) {
    case "client":
      return "/dashboard/patient";
    case "doctor":
      return "/dashboard/doctor";
    case "admin":
      return "/dashboard/admin";
    default:
      return "/dashboard/patient";
  }
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          res.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const url = new URL(req.url);
  const path = url.pathname;

  // Skip middleware for public routes
  if (isPublicRoute(path)) {
    return res;
  }

  // Get user session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Allow always accessible routes regardless of auth status
  if (isAlwaysAccessibleRoute(path)) {
    return res;
  }

  // Redirect unauthenticated users to homepage
  if (!session) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Load user profile for role and onboarding status
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarded")
    .eq("id", session.user.id)
    .maybeSingle();

  // Redirect non-onboarded users to welcome
  if (!profile?.onboarded) {
    return NextResponse.redirect(new URL("/welcome", req.url));
  }

  const userRole = (profile?.role as UserRole) ?? "client";
  const routeConfig = findRouteConfig(path);

  // Handle role-specific route access
  if (routeConfig) {
    // Check if user has permission for this route
    if (!routeConfig.allowedRoles.includes(userRole)) {
      const redirectPath = routeConfig.redirectPath || getRedirectPathForRole(userRole);
      return NextResponse.redirect(new URL(redirectPath, req.url));
    }

    // Handle legacy route redirects
    if (routeConfig.redirectPath) {
      return NextResponse.redirect(new URL(routeConfig.redirectPath, req.url));
    }
  }

  // Handle dashboard root - redirect to role-specific dashboard
  if (path === "/dashboard") {
    return NextResponse.redirect(new URL(getRedirectPathForRole(userRole), req.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/patient/:path*",
    "/client/:path*", 
    "/doctor/:path*",
    "/admin/:path*",
    "/analytics/:path*",
    "/patients/:path*",
    "/upload/:path*"
  ],
};


