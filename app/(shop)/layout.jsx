import AgeGate from "@/components/shop/AgeGate";
import { CartProvider } from "@/components/shop/CartContext";
import { LocaleProvider } from "@/lib/i18n/LocaleContext";
import { CurrencyProvider } from "@/lib/currency/CurrencyContext";
import { CustomerAuthProvider } from "@/lib/auth/CustomerAuthContext";
import Header from "@/components/shop/Header";
import Footer from "@/components/shop/Footer";
import CookieConsent from "@/components/shop/CookieConsent";
import SocialProofPopup from "@/components/shop/SocialProofPopup";
import AbandonedCartTracker from "@/components/shop/AbandonedCartTracker";

export default function ShopLayout({ children }) {
  return (
    <LocaleProvider>
      <CurrencyProvider>
        <CartProvider>
          <CustomerAuthProvider>
            <AgeGate>
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
              <CookieConsent />
              <SocialProofPopup />
              <AbandonedCartTracker />
            </AgeGate>
          </CustomerAuthProvider>
        </CartProvider>
      </CurrencyProvider>
    </LocaleProvider>
  );
}
