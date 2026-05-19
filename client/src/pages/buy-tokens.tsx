import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CreditCard, Wallet, Zap, Shield, CheckCircle } from "lucide-react";
import { Link } from "wouter";

// Initialize Stripe with error handling
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

interface TokenPackage {
  tokens: number;
  price: number;
  name: string;
}

interface TokenPackages {
  starter: TokenPackage;
  professional: TokenPackage;
  business: TokenPackage;
  enterprise: TokenPackage;
}

function CheckoutForm({ selectedPackage, packageKey }: { selectedPackage: TokenPackage, packageKey: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  const createPaymentIntent = useMutation({
    mutationFn: async (packageKey: string) => {
      return apiRequest("POST", "/api/payments/create-payment-intent", { packageKey });
    }
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment intent
      const { clientSecret } = await createPaymentIntent.mutateAsync(packageKey);

      if (!clientSecret) {
        throw new Error("Erro ao criar pagamento");
      }

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            name: 'Cliente Prompts Jurídicos',
          },
        }
      });

      if (error) {
        toast({
          title: "Erro no pagamento",
          description: error.message,
          variant: "destructive",
        });
      } else if (paymentIntent.status === 'succeeded') {
        // Confirm with backend
        await apiRequest("POST", "/api/payments/confirm", {
          paymentIntentId: paymentIntent.id
        });

        toast({
          title: "Pagamento realizado com sucesso!",
          description: `${selectedPackage.tokens.toLocaleString()} tokens foram adicionados à sua conta.`,
        });

        // Refresh user data and redirect
        queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      }
    } catch (error: any) {
      toast({
        title: "Erro no pagamento",
        description: error.message || "Erro ao processar pagamento",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Informações do Cartão
          </CardTitle>
          <CardDescription>
            Digite os dados do seu cartão de crédito de forma segura
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-900">
            <CardElement 
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                  invalid: {
                    color: '#9e2146',
                  },
                },
              }}
            />
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Shield className="h-4 w-4" />
            Seus dados são protegidos com criptografia SSL
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Pacote selecionado:</span>
              <span className="font-medium">{selectedPackage.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Tokens:</span>
              <span className="font-medium">{selectedPackage.tokens.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>R$ {(selectedPackage.price / 100).toFixed(2).replace('.', ',')}</span>
            </div>
          </div>

          <Button
            type="submit"
            disabled={!stripe || isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Processando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Finalizar Compra
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}

export default function BuyTokens() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  // Fetch available packages
  const { data: packagesData } = useQuery({
    queryKey: ["/api/payments/packages"],
    retry: false
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Login Necessário</CardTitle>
            <CardDescription>
              Você precisa estar logado para comprar tokens.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full">
                Fazer Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const packages = packagesData?.packages as TokenPackages;

  if (!packages) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getRecommendedBadge = (key: string) => {
    if (key === 'professional') return <Badge variant="secondary">Recomendado</Badge>;
    if (key === 'business') return <Badge variant="outline">Melhor Custo-Benefício</Badge>;
    return null;
  };

  const getPackageIcon = (key: string) => {
    switch (key) {
      case 'starter': return <Zap className="h-6 w-6 text-blue-500" />;
      case 'professional': return <Wallet className="h-6 w-6 text-green-500" />;
      case 'business': return <CreditCard className="h-6 w-6 text-purple-500" />;
      case 'enterprise': return <Shield className="h-6 w-6 text-orange-500" />;
      default: return <Zap className="h-6 w-6" />;
    }
  };

  if (selectedPackage && packages[selectedPackage as keyof TokenPackages]) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setSelectedPackage(null)}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos Pacotes
            </Button>
          </div>

          <div className="max-w-md mx-auto">
            <Elements stripe={stripePromise}>
              <CheckoutForm 
                selectedPackage={packages[selectedPackage as keyof TokenPackages]}
                packageKey={selectedPackage}
              />
            </Elements>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Início
            </Button>
          </Link>
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Compre Tokens
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Escolha o pacote ideal para suas necessidades jurídicas
          </p>

          {user && (
            <div className="mt-4 p-4 bg-blue-100 dark:bg-blue-900 rounded-lg inline-block">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                <span className="text-blue-800 dark:text-blue-200">
                  Saldo atual: <strong>{user.tokenBalance?.toLocaleString() || 0} tokens</strong>
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {Object.entries(packages).map(([key, pkg]) => (
            <Card key={key} className="relative hover:shadow-lg transition-shadow">
              {getRecommendedBadge(key) && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                  {getRecommendedBadge(key)}
                </div>
              )}
              
              <CardHeader className="text-center">
                <div className="mx-auto mb-4">
                  {getPackageIcon(key)}
                </div>
                <CardTitle className="text-xl">{pkg.name}</CardTitle>
                <CardDescription>
                  {pkg.tokens.toLocaleString()} tokens
                </CardDescription>
              </CardHeader>
              
              <CardContent className="text-center space-y-4">
                <div className="text-3xl font-bold text-primary">
                  R$ {(pkg.price / 100).toFixed(2).replace('.', ',')}
                </div>
                
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  R$ {((pkg.price / 100) / pkg.tokens).toFixed(4).replace('.', ',')} por token
                </div>
                
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => setSelectedPackage(key)}
                >
                  Escolher Pacote
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2">
                <Shield className="h-5 w-5" />
                Pagamento Seguro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>• Processamento seguro via Stripe</p>
              <p>• Criptografia SSL de ponta a ponta</p>
              <p>• Não armazenamos dados do seu cartão</p>
              <p>• Tokens são adicionados automaticamente após confirmação</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}