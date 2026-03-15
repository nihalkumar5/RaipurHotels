"use client";

interface WelcomeMessageOptions {
  guestName: string;
  hotelName: string;
  roomNumber: string;
  welcomeMessage?: string | null;
  pin?: string | null;
}

const normalizeLine = (value?: string | null) => value?.replace(/\s+/g, " ").trim() || "";

export const formatWhatsAppPhone = (phone: string) => {
  const numericPhone = phone.replace(/[^0-9]/g, "");
  return numericPhone.length === 10 ? `91${numericPhone}` : numericPhone;
};

export const buildWhatsAppUrl = (phone: string, message: string) => {
  const formattedPhone = formatWhatsAppPhone(phone);

  if (!formattedPhone) {
    return null;
  }

  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
};

export const buildGuestWelcomeMessage = ({
  guestName,
  hotelName,
  roomNumber,
  welcomeMessage,
  pin,
}: WelcomeMessageOptions) => {
  const customLine = normalizeLine(welcomeMessage) || "We are here if you need anything.";

  const lines = [
    `Namaste ${normalizeLine(guestName)},`,
    `Welcome to ${normalizeLine(hotelName)}.`,
    `Room ${normalizeLine(roomNumber)} is ready.`,
    pin ? `Access PIN: ${normalizeLine(pin)}.` : null,
    customLine,
  ].filter(Boolean);

  return lines.join("\n");
};
