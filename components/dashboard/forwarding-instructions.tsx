import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  leadRescueNumber: string | null;
  businessName?: string;
};

export function ForwardingInstructions({ leadRescueNumber, businessName }: Props) {
  return (
    <Card className="border-dashed shadow-sm">
      <CardHeader>
        <CardTitle className="font-heading text-lg">Call forwarding</CardTitle>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Keep your current business number. Forward missed or unanswered calls to your
          LeadRescue number. When you miss a call, LeadRescue instantly texts the customer
          back and captures the lead.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {leadRescueNumber ? (
          <div className="rounded-lg bg-muted/80 px-4 py-3">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Your LeadRescue number
            </p>
            <p className="font-mono text-lg font-semibold tracking-tight">
              {leadRescueNumber}
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Generate your LeadRescue number in Setup. You will forward missed calls to that
            number from your existing business line.
          </p>
        )}
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>Open your phone carrier or VoIP settings for {businessName ?? "your business"}.</li>
          <li>
            Enable conditional call forwarding for busy / no-answer (wording varies by carrier).
          </li>
          <li>Forward those calls to the LeadRescue number above.</li>
          <li>Place a test call. You should receive the instant SMS follow-up on your cell.</li>
        </ol>
        <p className="text-muted-foreground text-xs">
          LeadRescue does not replace your phone system. It only catches forwarded missed calls
          and runs the SMS recovery flow.
        </p>
      </CardContent>
    </Card>
  );
}
