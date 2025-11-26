import { db } from "@/lib/db"

export type Plan = "free" | "trial" | "pro" | "pro_max"

export interface SubscriptionStatus {
  plan: Plan
  isActive: boolean
  isTrial: boolean
  trialEnd?: Date
  subscriptionEnd?: Date
  daysRemaining?: number
}

export async function getUserSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      isActive: true,
      trialStart: true,
      trialEnd: true,
      subscriptionStart: true,
      subscriptionEnd: true,
    },
  })

  if (!user) {
    return {
      plan: "free",
      isActive: false,
      isTrial: false,
    }
  }

  const now = new Date()
  const normalizedPlan = user.plan === "enterprise" ? "pro_max" : (user.plan as Plan)
  const isTrial = normalizedPlan === "trial" && user.trialEnd && user.trialEnd > now
  const isActive = user.isActive && (isTrial || (user.subscriptionEnd && user.subscriptionEnd > now))

  // Calculate days remaining
  let daysRemaining: number | undefined
  if (isTrial && user.trialEnd) {
    daysRemaining = Math.ceil((user.trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  } else if (user.subscriptionEnd) {
    daysRemaining = Math.ceil((user.subscriptionEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  // Auto-expire trial if ended
  if (normalizedPlan === "trial" && user.trialEnd && user.trialEnd <= now) {
    await db.user.update({
      where: { id: userId },
      data: {
        plan: "free",
        isActive: false,
      },
    })
    return {
      plan: "free",
      isActive: false,
      isTrial: false,
    }
  }

  return {
    plan: normalizedPlan,
    isActive: isActive || false,
    isTrial: isTrial || false,
    trialEnd: user.trialEnd || undefined,
    subscriptionEnd: user.subscriptionEnd || undefined,
    daysRemaining,
  }
}

export async function activateSubscription(
  userId: string,
  plan: "pro" | "pro_max",
  durationMonths: number = 1
): Promise<void> {
  const now = new Date()
  const subscriptionEnd = new Date()
  subscriptionEnd.setMonth(subscriptionEnd.getMonth() + durationMonths)

  await db.user.update({
    where: { id: userId },
    data: {
      plan,
      isActive: true,
      subscriptionStart: now,
      subscriptionEnd,
      trialEnd: null, // Clear trial when subscribing
    },
  })
}

