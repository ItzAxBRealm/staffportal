import { Link, useNavigate } from "react-router-dom";

const ErrorPage = () => {
  const navigate = useNavigate();

  return (
    <section className="flex flex-col mx-auto gap-10 py-6 text-center [--shadow:black] [--text:#7AB2B2] dark:[--shadow:white] dark:[--text:black]">
      <div className="relative isolate mt-32 animate-bounce rounded-xl text-9xl font-bold text-[var(--shadow)] before:absolute before:inset-0 before:-z-10 before:translate-x-1.5 before:translate-y-1.5 before:content-['404']">
        <span className="relative z-10 text-[var(--text)] [-webkit-text-stroke:1.5px_var(--shadow);] [text-stroke:1.5px_var(--shadow);]">404</span>
      </div>
      <p className="text-lg font-semibold text-[var(--shadow)]">Page you're looking for is not found</p>
      <div className="flex items-center justify-center gap-6">
        <button onClick={() => navigate(-1)} className="group cursor-pointer border-2 border-[var(--shadow)] bg-[var(--text)] px-5 py-2.5 text-[var(--shadow)] shadow-[3px_4px_var(--shadow)] duration-100 focus-visible:outline focus-visible:outline-[var(--shadow)] active:shadow-[1px_1px_var(--shadow)]">
          Go back
        </button>
        <Link to="/" className="group border-2 border-[var(--shadow)] bg-[var(--text)] px-5 py-2.5 text-[var(--shadow)] shadow-[3px_4px_var(--shadow)] duration-100 focus-visible:outline focus-visible:outline-[var(--shadow)] active:shadow-[1px_1px_var(--shadow)]">
          Home
        </Link>
      </div>
    </section>
  )
}

export default ErrorPage;
