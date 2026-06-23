import AgeGate from "@/components/shop/AgeGate";
import { CartProvider } from "@/components/shop/CartContext";
import { LocaleProvider } from "@/lib/i18n/LocaleContext";
import { CurrencyProvider } from "@/lib/currency/CurrencyContext";
import Header from "@/components/shop/Header";
import Footer from "@/components/shop/Footer";
import CookieConsent from "@/components/shop/CookieConsent";

export default function ShopLayout({ children }) {
  return (
    <LocaleProvider>
      <CurrencyProvider>
        <CartProvider>
          <AgeGate>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <CookieConsent />
          </AgeGate>
        </CartProvider>
      </CurrencyProvider>
    </LocaleProvider>
  );
}
