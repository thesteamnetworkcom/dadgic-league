
import { supabase } from '@/lib/supabase'

export default function SignInButton() {
  const signInWithDiscord = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: "https://localhost:3000/register"
      }
    })
  }

  return (
    <button
      onClick={signInWithDiscord}
      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
    >
      Sign in with Discord
    </button>
  )
}