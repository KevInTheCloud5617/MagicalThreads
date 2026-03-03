import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Banner — exact logo bg color, image fills full width */}
      <div className="relative w-full bg-[#ecd2af] overflow-hidden">
        {/* Shooting stars */}
        <div className="shooting-star shooting-star-1" />
        <div className="shooting-star shooting-star-2" />
        <div className="shooting-star shooting-star-3" />

        <Image
          src="/logo.jpg"
          alt="Magical Threads with Meg"
          width={1200}
          height={1200}
          className="w-full max-w-2xl h-auto mx-auto relative z-10"
          priority
        />
      </div>

      {/* Coming Soon */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center py-12 bg-[#F5EDE0]">
        <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold text-[#4A3728] mb-4">
          Products Coming Soon
        </h1>
        <p className="text-[#6B5A4E] text-lg max-w-md mb-10">
          Handcrafted embroidery, custom vinyl, and lovingly made gifts — each piece stitched with a touch of magic.
        </p>

        <div className="flex items-center gap-3 text-[#4A3728]/30 mb-10">
          <span className="text-sm">✦</span>
          <div className="w-16 h-px bg-[#4A3728]/20" />
          <span className="text-lg">✨</span>
          <div className="w-16 h-px bg-[#4A3728]/20" />
          <span className="text-sm">✦</span>
        </div>

        <p className="text-[#6B5A4E]/80 text-sm">
          Follow along on{" "}
          <a
            href={`https://instagram.com/${process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE || "mystore"}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#4A3728] hover:text-[#4A3728]/70 font-medium underline underline-offset-2 transition-colors"
          >
            {process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE || "mystore"}
          </a>{" "}
          for updates and sneak peeks
        </p>
      </div>
    </div>
  );
}
