import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Plus, Zap } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function BuyTokensButton() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return null;
  }

  const tokenBalance = user.tokenBalance || 0;
  const isLowBalance = tokenBalance < 100;

  return (
    <Link href="/comprar-tokens">
      <Button 
        variant={isLowBalance ? "destructive" : "outline"} 
        size="sm"
        className="flex items-center gap-2"
      >
        <Wallet className="h-4 w-4" />
        <span className="hidden sm:inline">
          {tokenBalance.toLocaleString()} tokens
        </span>
        <span className="sm:hidden">
          {tokenBalance > 999 ? `${Math.floor(tokenBalance/1000)}k` : tokenBalance}
        </span>
        {isLowBalance && (
          <Badge variant="secondary" className="ml-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
            <Plus className="h-3 w-3 mr-1" />
            Comprar
          </Badge>
        )}
        {!isLowBalance && (
          <Plus className="h-3 w-3" />
        )}
      </Button>
    </Link>
  );
}