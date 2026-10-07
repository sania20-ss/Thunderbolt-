package com.auth.service;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CaptchaService {

    private static final String CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final int CODE_LENGTH = 6;
    private static final long EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes

    private final SecureRandom random = new SecureRandom();
    private final Map<String, CaptchaEntry> tokenStore = new ConcurrentHashMap<>();

    private record CaptchaEntry(String solution, long expiresAt) {}

    /**
     * Generates a 6-character visual CAPTCHA challenge with noise distortion.
     */
    public Map<String, Object> generateChallenge() {
        cleanExpiredTokens();

        String token = UUID.randomUUID().toString();
        StringBuilder codeBuilder = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            codeBuilder.append(CHARSET.charAt(random.nextInt(CHARSET.length())));
        }
        String solution = codeBuilder.toString();
        long expiresAt = System.currentTimeMillis() + EXPIRATION_MS;

        tokenStore.put(token, new CaptchaEntry(solution, expiresAt));

        String svgImage = generateCaptchaSvg(solution);
        String base64Svg = "data:image/svg+xml;base64," + Base64.getEncoder().encodeToString(svgImage.getBytes());

        return Map.of(
            "token", token,
            "captchaToken", token,
            "image", base64Svg,
            "svg", svgImage,
            "expiresAt", expiresAt
        );
    }

    /**
     * Verifies user-submitted CAPTCHA solution.
     */
    public boolean verify(String token, String input) {
        return verifySolution(token, input);
    }

    public boolean verifySolution(String token, String input) {
        if (token == null || input == null || token.isBlank() || input.isBlank()) {
            return false;
        }

        CaptchaEntry entry = tokenStore.remove(token);
        if (entry == null) {
            return false;
        }

        if (System.currentTimeMillis() > entry.expiresAt()) {
            return false;
        }

        return entry.solution().equalsIgnoreCase(input.trim());
    }

    private void cleanExpiredTokens() {
        long now = System.currentTimeMillis();
        tokenStore.entrySet().removeIf(entry -> now > entry.getValue().expiresAt());
    }

    private String generateCaptchaSvg(String text) {
        StringBuilder svg = new StringBuilder();
        svg.append("<svg xmlns='http://www.w3.org/2000/svg' width='180' height='54' viewBox='0 0 180 54'>");
        svg.append("<rect width='100%' height='100%' fill='#0f172a' rx='10'/>");

        // Noise lines
        for (int i = 0; i < 4; i++) {
            int x1 = random.nextInt(180);
            int y1 = random.nextInt(54);
            int x2 = random.nextInt(180);
            int y2 = random.nextInt(54);
            String strokeColor = i % 2 == 0 ? "rgba(99,102,241,0.3)" : "rgba(244,63,94,0.3)";
            svg.append(String.format("<line x1='%d' y1='%d' x2='%d' y2='%d' stroke='%s' stroke-width='1.5'/>", x1, y1, x2, y2, strokeColor));
        }

        // Noise dots
        for (int i = 0; i < 25; i++) {
            int cx = random.nextInt(180);
            int cy = random.nextInt(54);
            int r = random.nextInt(2) + 1;
            svg.append(String.format("<circle cx='%d' cy='%d' r='%d' fill='rgba(148,163,184,0.35)'/>", cx, cy, r));
        }

        // Render characters with distortion
        String[] colors = {"#38bdf8", "#818cf8", "#c084fc", "#f472b6", "#34d399", "#fbbf24"};
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            int x = 20 + (i * 24) + random.nextInt(6) - 3;
            int y = 35 + random.nextInt(6) - 3;
            int rotate = random.nextInt(30) - 15;
            String color = colors[i % colors.length];
            svg.append(String.format(
                "<text x='%d' y='%d' font-family='monospace' font-size='26' font-weight='bold' fill='%s' transform='rotate(%d, %d, %d)'>%c</text>",
                x, y, color, rotate, x, y, c
            ));
        }

        svg.append("</svg>");
        return svg.toString();
    }
}
