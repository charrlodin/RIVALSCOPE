'use client';

import Link from 'next/link';
import { 
  SignInButton, 
  SignUpButton, 
  UserButton, 
  SignedIn, 
  SignedOut 
} from '@clerk/nextjs';
import Button from '@/components/ui/Button';

export default function Header() {
  return (
    <header className="bg-brutalist-black border-b-4 border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/?stay=true" className="text-2xl font-bold text-brutalist-yellow font-mono">
            RIVALSCOPE
          </Link>
          
          <SignedIn>
            <nav className="hidden md:flex space-x-4">
              <Link href="/dashboard" className="text-white hover:text-brutalist-yellow font-bold">
                DASHBOARD
              </Link>
              <Link href="/competitors" className="text-white hover:text-brutalist-yellow font-bold">
                COMPETITORS
              </Link>
              <Link href="/reports" className="text-white hover:text-brutalist-yellow font-bold">
                REPORTS
              </Link>
            </nav>
          </SignedIn>

          <div className="flex items-center space-x-2">
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm" className="text-white border-white hover:bg-white hover:text-black">
                  LOGIN
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm">
                  SIGN UP
                </Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10 border-4 border-brutalist-yellow",
                    userButtonPopoverCard: "border-4 border-black shadow-brutal",
                    userButtonPopoverActionButton: "hover:bg-brutalist-yellow hover:text-black font-bold"
                  }
                }}
              />
            </SignedIn>
          </div>
        </div>
      </div>
    </header>
  );
}