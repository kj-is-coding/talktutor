import { NextRequest, NextResponse } from 'next/server';
import { inviteUser } from '@/lib/invite-operations';
import { getUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { email, name } = await request.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    const result = await inviteUser(email, name, user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Generate invite link
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const inviteUrl = result.inviteToken
      ? `${baseUrl}/invite/${result.inviteToken}`
      : null;

    return NextResponse.json({
      success: true,
      inviteUrl,
      message: inviteUrl
        ? 'User invited successfully'
        : 'User already accepted, can log in directly'
    });
  } catch (error) {
    console.error('Error inviting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
