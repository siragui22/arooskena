import Image from "next/image";

const header = () => {
  return (
    <div>
        <div className="navbar bg-base-100 shadow-sm">
  <div className="flex-1">
        <Image
      src="/logo.svg"
      alt="Picture of the author"
      width={100}
      height={100}
    />
  </div>

</div>
    </div>
  )
}

export default header