import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useClerk } from "@clerk/clerk-react";
import { CalendarDays, Clock, Link, Mail, Phone, User, Users } from "lucide-react";

function formatMemberSince(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function formatLastSignIn(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getProviderIcon(provider: string) {
  switch (provider.toLowerCase()) {
    case "google":
      return (
        <svg
          className="size-5 text-blue-500"
          fill="currentColor"
          role="img"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
        </svg>
      );
    default:
      return <Link />;
  }
}

export default function UserProfile() {
  const { user } = useClerk();
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header Section */}
        <Card>
          <CardContent className="flex-1">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={user?.imageUrl || "https://placehold.co/80/orange/white"}
                  alt="User Avatar"
                />
                <AvatarFallback className="text-lg">
                  {user?.fullName ? getInitials(user.fullName) : "User"}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <CardTitle className="text-2xl">{user?.fullName}</CardTitle>
                {user?.username && (
                  <p className="text-muted-foreground">@{user.username}</p>
                )}
                {user?.createdAt && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    <span>Member since {formatMemberSince(user?.createdAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email */}
            {user?.emailAddresses[0]?.emailAddress && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email Address</p>
                  <p className="text-sm text-muted-foreground">
                    {user.emailAddresses[0].emailAddress}
                  </p>
                </div>
              </div>
            )}

            {/* Phone */}
            {user?.phoneNumbers[0]?.phoneNumber && (
              <>
                <Separator />
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Phone Number</p>
                    <p className="text-sm text-muted-foreground">
                      {user.phoneNumbers[0].phoneNumber}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Account Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Account Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Account Created</p>
                <p className="text-sm text-muted-foreground">
                  {user?.createdAt?.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Last Sign-In</p>
                <p className="text-sm text-muted-foreground">
                  {user?.lastSignInAt ? formatLastSignIn(user?.lastSignInAt) : "Unknown"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* External Accounts */}
        {user?.externalAccounts && user.externalAccounts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Connected Accounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {user.externalAccounts.map((account, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getProviderIcon(account.provider)}
                      <div>
                        <p className="text-sm font-medium capitalize">
                          {account.provider}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {account.emailAddress || account.username || "Connected"}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Connected
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
