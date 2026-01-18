import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { tickets, users, responses } from "@/db/schema";
import { eq, count, desc, sql } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TicketCard } from "@/components/tickets/ticket-card";

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session?.user || session.user.accessLevel !== "admin") {
    redirect("/tickets");
  }

  // Get stats
  const [ticketStats] = await db
    .select({
      total: count(),
      open: count(sql`CASE WHEN ${tickets.status} = 'open' THEN 1 END`),
      inProgress: count(
        sql`CASE WHEN ${tickets.status} = 'in-progress' THEN 1 END`
      ),
      resolved: count(sql`CASE WHEN ${tickets.status} = 'resolved' THEN 1 END`),
    })
    .from(tickets);

  const [userStats] = await db
    .select({
      total: count(),
      admins: count(sql`CASE WHEN ${users.accessLevel} = 'admin' THEN 1 END`),
    })
    .from(users);

  // Get recent open tickets
  const recentOpenTickets = await db.query.tickets.findMany({
    where: eq(tickets.status, "open"),
    orderBy: [desc(tickets.createdAt)],
    limit: 5,
    with: {
      user: {
        columns: {
          givenName: true,
          familyName: true,
        },
      },
      responses: {
        columns: {
          id: true,
        },
      },
    },
  });

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-semibold">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{ticketStats.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {ticketStats.open}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">
              {ticketStats.inProgress}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {ticketStats.resolved}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Users stat */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Users</p>
            <p className="text-xl font-semibold">{userStats.total}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Admins</p>
            <p className="text-xl font-semibold">{userStats.admins}</p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Open Tickets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Recent Open Tickets</h2>
          <Badge variant="open">{ticketStats.open} open</Badge>
        </div>

        {recentOpenTickets.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No open tickets
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentOpenTickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} showUser />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
