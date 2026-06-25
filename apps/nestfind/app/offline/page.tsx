import Link from 'next/link';
import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return <main className="grid min-h-dvh place-items-center bg-white px-6 text-center text-stone-900"><div className="max-w-md"><span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-amber-100 text-amber-800"><WifiOff className="h-7 w-7" /></span><h1 className="mt-6 font-serif text-4xl font-bold">You’re offline</h1><p className="mt-3 leading-7 text-stone-600">Saved apartments and search history remain on this device. Voice search needs a connection to Agora.</p><Link href="/" className="mt-7 inline-flex h-11 items-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white">Return to NestFind</Link></div></main>;
}
