import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function DELETE() {
  try {
    // Delete all accounts first (foreign key constraint)
    const deletedAccounts = await db.account.deleteMany({})
    
    // Delete all sessions
    const deletedSessions = await db.session.deleteMany({})
    
    // Delete all users
    const deletedUsers = await db.user.deleteMany({})
    
    return NextResponse.json({
      success: true,
      deleted: {
        users: deletedUsers.count,
        accounts: deletedAccounts.count,
        sessions: deletedSessions.count,
      },
    })
  } catch (error: any) {
    console.error("Clear DB error:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression", details: error.message },
      { status: 500 }
    )
  }
}

