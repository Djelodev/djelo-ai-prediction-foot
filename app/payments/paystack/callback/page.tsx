"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2, XCircle } from "lucide-react"

type StatusState = "loading" | "success" | "error"

function PaystackCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reference = searchParams.get("reference")
  const [status, setStatus] = useState<StatusState>("loading")
  const [message, setMessage] = useState("Nous confirmons votre paiement...")

  useEffect(() => {
    if (!reference) {
      setStatus("error")
      setMessage("Référence de paiement manquante.")
      return
    }

    const controller = new AbortController()

    async function verifyPayment() {
      try {
        const response = await fetch(`/api/payments/paystack/verify?reference=${reference}`, {
          signal: controller.signal,
        })
        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Impossible de confirmer le paiement.")
        }

        setStatus("success")
        setMessage("Paiement confirmé ! Activation de votre abonnement...")

        setTimeout(() => {
          router.replace("/dashboard?subscribed=true")
        }, 1800)
      } catch (error) {
        if (controller.signal.aborted) return
        const errMessage =
          error instanceof Error ? error.message : "Une erreur est survenue lors de la vérification."
        setStatus("error")
        setMessage(errMessage)
      }
    }

    verifyPayment()

    return () => controller.abort()
  }, [reference, router])

  const renderIcon = () => {
    if (status === "success") {
      return <CheckCircle2 className="h-10 w-10 text-emerald-500" />
    }

    if (status === "error") {
      return <XCircle className="h-10 w-10 text-destructive" />
    }

    return <Loader2 className="h-10 w-10 text-primary animate-spin" />
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4 py-12">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center space-y-3">
          <div className="flex justify-center">{renderIcon()}</div>
          <CardTitle className="text-2xl font-semibold">
            {status === "success" && "Paiement confirmé"}
            {status === "error" && "Paiement non confirmé"}
            {status === "loading" && "Vérification en cours"}
          </CardTitle>
          <p className="text-muted-foreground">{message}</p>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === "loading" && (
            <p className="text-sm text-muted-foreground">
              Cette étape peut prendre quelques secondes. Merci de patienter sans fermer cette page.
            </p>
          )}
          {status === "error" && (
            <>
              <p className="text-sm text-muted-foreground">
                Si votre paiement a été débité, contactez le support avec la référence&nbsp;
                <span className="font-semibold">{reference ?? "inconnue"}</span>.
              </p>
              <div className="flex flex-col gap-3">
                <Button variant="outline" asChild>
                  <Link href="/checkout">Revenir au paiement</Link>
                </Button>
                <Button asChild>
                  <Link href="/dashboard">Aller au dashboard</Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaystackCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <PaystackCallbackContent />
    </Suspense>
  )
}

