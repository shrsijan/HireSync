import Image from "next/image"

export default function Logo() {
    return (
        <div className="relative h-10 w-32">
            <Image
                src="/logo.svg"
                alt="Hiresync Logo"
                fill
                className="object-contain object-left"
                priority
            />
        </div>
    )
}
