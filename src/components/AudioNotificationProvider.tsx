"use client";

import { useEffect } from "react";

/**
 * Listens for messages from the Service Worker and plays
 * an audio notification when a push is received.
 */
export default function AudioNotificationProvider() {
  useEffect(() => {
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === "PLAY_NOTIFICATION_SOUND") {
        playNotificationSound();
      }
    };

    navigator.serviceWorker?.addEventListener("message", handleSWMessage);

    return () => {
      navigator.serviceWorker?.removeEventListener("message", handleSWMessage);
    };
  }, []);

  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      // Play a cheerful 3-tone chime (Do-Mi-Sol)
      const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
      let startTime = ctx.currentTime;

      frequencies.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(freq, startTime + i * 0.3);

        gainNode.gain.setValueAtTime(0, startTime + i * 0.3);
        gainNode.gain.linearRampToValueAtTime(0.6, startTime + i * 0.3 + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, startTime + i * 0.3 + 0.5);

        oscillator.start(startTime + i * 0.3);
        oscillator.stop(startTime + i * 0.3 + 0.6);
      });

      // After tones, use speech synthesis for the message
      setTimeout(() => {
        if ("speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(
            "Santap sahur Anda sudah siap. Silahkan mengambilnya di sekretariat."
          );
          utterance.lang = "id-ID";
          utterance.rate = 0.9;
          utterance.pitch = 1.1;
          window.speechSynthesis.speak(utterance);
        }
      }, 1100);
    } catch (err) {
      console.warn("Audio notification failed:", err);
    }
  };

  return null; // No UI, purely functional
}
