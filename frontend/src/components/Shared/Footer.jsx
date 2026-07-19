export default function Footer() {
  return (
    <footer className="bg-surface-container-lowest w-full py-xl border-t border-white/5 mt-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-lg px-margin-mobile md:px-margin-desktop max-w-max-width mx-auto">
        <div className="col-span-1 md:col-span-1 flex flex-col gap-sm">
          <div className="font-display-lg text-headline-md text-primary-container">
            KriptoKasa
          </div>
          <p className="font-body-base text-body-base text-on-surface-variant text-sm mt-4">
            © 2024 KriptoKasa Ecosystem. High-Frequency Security Guaranteed.
          </p>
        </div>
        <div className="col-span-1 md:col-span-3 flex flex-wrap justify-end gap-x-xl gap-y-md items-center opacity-80">
          <a className="font-body-base text-body-base text-on-surface-variant hover:text-secondary-fixed transition-colors hover:opacity-100" href="#">Ecosystem</a>
          <a className="font-body-base text-body-base text-on-surface-variant hover:text-secondary-fixed transition-colors hover:opacity-100" href="#">Security</a>
          <a className="font-body-base text-body-base text-on-surface-variant hover:text-secondary-fixed transition-colors hover:opacity-100" href="#">Privacy Policy</a>
          <a className="font-body-base text-body-base text-on-surface-variant hover:text-secondary-fixed transition-colors hover:opacity-100" href="#">Terms of Service</a>
          <a className="font-body-base text-body-base text-on-surface-variant hover:text-secondary-fixed transition-colors hover:opacity-100" href="#">Support</a>
        </div>
      </div>
    </footer>
  );
}
