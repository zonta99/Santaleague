import Image from "next/image";


export default function GameScore() {
    return (
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <Image
                    alt="Juve"
                    className="rounded-full"
                    height="48"
                    src="/placeholder.svg"
                    style={{
                        aspectRatio: "48/48",
                        objectFit: "cover",
                    }}
                    width="48"
                />
                <div>
                    <h3 className="font-medium">Juve</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Juve</p>
                </div>
            </div>
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg w-16 h-10">
                <div className="flex h-full items-center justify-center text-sm font-semibold">1-1</div>
            </div>
            <div className="flex items-center gap-2">
                <img
                    alt="Milan"
                    className="rounded-full"
                    height="48"
                    src="/placeholder.svg"
                    style={{
                        aspectRatio: "48/48",
                        objectFit: "cover",
                    }}
                    width="48"
                />
                <div>
                    <h3 className="font-medium">Milan</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Milan</p>
                </div>
            </div>
        </div>
    )
}