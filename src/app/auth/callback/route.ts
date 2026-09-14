import { NextResponse } from 'next/server';
import { sessionDb } from '@/lib/server/db';

export async function GET(request:Request) {
 const url=new URL(request.url),code=url.searchParams.get('code');
 if(code){const db=await sessionDb();const {error}=await db.auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(new URL('/onboarding',url.origin));}
 return NextResponse.redirect(new URL('/auth/login?error=confirmation',url.origin));
}
