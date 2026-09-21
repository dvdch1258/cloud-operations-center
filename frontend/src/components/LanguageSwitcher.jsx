import { useTranslation } from "react-i18next";


export default function LanguageSwitcher({
  className = "",
}) {
  const {
    i18n,
    t,
  } = useTranslation();

  const currentLanguage =
    String(
      i18n.resolvedLanguage ||
      i18n.language ||
      "en",
    )
      .toLowerCase()
      .startsWith("es")
      ? "es"
      : "en";

  function changeLanguage(language) {
    if (language === currentLanguage) {
      return;
    }

    i18n.changeLanguage(language);
  }

  return (
    <div
      className={
        `language-switcher ${className}`.trim()
      }
      role="group"
      aria-label={t("language.selector")}
    >
      <button
        type="button"
        className={
          currentLanguage === "en"
            ? "language-switcher__button language-switcher__button--active"
            : "language-switcher__button"
        }
        aria-pressed={
          currentLanguage === "en"
        }
        title={t("language.english")}
        onClick={() =>
          changeLanguage("en")
        }
      >
        EN
      </button>

      <button
        type="button"
        className={
          currentLanguage === "es"
            ? "language-switcher__button language-switcher__button--active"
            : "language-switcher__button"
        }
        aria-pressed={
          currentLanguage === "es"
        }
        title={t("language.spanish")}
        onClick={() =>
          changeLanguage("es")
        }
      >
        ES
      </button>
    </div>
  );
}
