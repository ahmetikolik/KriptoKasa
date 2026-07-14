package Kripto.Kasa.ai;

import Kripto.Kasa.auth.AuthService;
import Kripto.Kasa.common.BusinessException;
import Kripto.Kasa.market.MarketPrice;
import Kripto.Kasa.market.MarketService;
import Kripto.Kasa.portfolio.Holding;
import Kripto.Kasa.portfolio.HoldingRepository;
import Kripto.Kasa.trading.TradeTransaction;
import Kripto.Kasa.trading.TradeTransactionRepository;
import Kripto.Kasa.user.AppUser;
import Kripto.Kasa.wallet.Wallet;
import Kripto.Kasa.wallet.WalletRepository;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
public class AiService {
    private static final ParameterizedTypeReference<Map<String, Object>> GEMINI_RESPONSE_TYPE =
            new ParameterizedTypeReference<>() {
            };

    private final AuthService authService;
    private final WalletRepository walletRepository;
    private final HoldingRepository holdingRepository;
    private final TradeTransactionRepository transactionRepository;
    private final MarketService marketService;
    private final WebClient.Builder webClientBuilder;
    private final AiProperties aiProperties;

    public AiService(
            AuthService authService,
            WalletRepository walletRepository,
            HoldingRepository holdingRepository,
            TradeTransactionRepository transactionRepository,
            MarketService marketService,
            WebClient.Builder webClientBuilder,
            AiProperties aiProperties
    ) {
        this.authService = authService;
        this.walletRepository = walletRepository;
        this.holdingRepository = holdingRepository;
        this.transactionRepository = transactionRepository;
        this.marketService = marketService;
        this.webClientBuilder = webClientBuilder;
        this.aiProperties = aiProperties;
    }

    @Transactional(readOnly = true)
    public AiQueryResponse answer(Long userId, AiQueryRequest request) {
        if (!StringUtils.hasText(aiProperties.getApiKey())) {
            throw new BusinessException(HttpStatus.SERVICE_UNAVAILABLE, "Gemini API key is not configured");
        }

        AppUser user = authService.requireUser(userId);
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR, "Wallet not found"));
        List<Holding> holdings = holdingRepository.findByUserIdOrderBySymbolAsc(userId);
        List<TradeTransaction> transactions = transactionRepository.findTop20ByUserIdOrderByCreatedAtDesc(userId);
        List<MarketPrice> prices = marketService.getLatestPrices();

        Map<String, Object> response = callGemini(buildPrompt(user, wallet, holdings, transactions, prices, request));
        return new AiQueryResponse(extractAnswer(response));
    }

    private Map<String, Object> callGemini(String prompt) {
        try {
            return webClientBuilder
                    .baseUrl(aiProperties.getBaseUrl())
                    .build()
                    .post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/v1beta/models/{model}:generateContent")
                            .queryParam("key", aiProperties.getApiKey())
                            .build(aiProperties.getModel()))
                    .bodyValue(Map.of(
                            "contents", List.of(Map.of(
                                    "parts", List.of(Map.of("text", prompt))
                            )),
                            "generationConfig", Map.of(
                                    "temperature", 0.35,
                                    "maxOutputTokens", 700
                            )
                    ))
                    .retrieve()
                    .bodyToMono(GEMINI_RESPONSE_TYPE)
                    .block();
        } catch (WebClientResponseException exception) {
            if (exception.getStatusCode().value() == 429) {
                throw new BusinessException(HttpStatus.SERVICE_UNAVAILABLE, "Gemini usage limit reached");
            }
            throw new BusinessException(HttpStatus.BAD_GATEWAY, "AI service rejected the request");
        } catch (Exception exception) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY, "AI service is unavailable right now");
        }
    }

    private String buildPrompt(
            AppUser user,
            Wallet wallet,
            List<Holding> holdings,
            List<TradeTransaction> transactions,
            List<MarketPrice> prices,
            AiQueryRequest request
    ) {
        return """
                Sen CryptoPal uygulamasinin AI portfoy asistanisin.
                Turkce cevap ver. Kisa, net ve yeni baslayan birine anlatir gibi acikla.
                Kesin al/sat emri verme; bunun finansal tavsiye olmadigini belirt.
                Sadece verilen kullanici portfoyu, islem gecmisi ve canli fiyat verisine dayan.

                Kullanici:
                email=%s
                nakit_bakiye_usd=%s

                Canli fiyatlar:
                %s

                Portfoy:
                %s

                Son islemler:
                %s

                Kullanici sorusu:
                %s
                """.formatted(
                user.getEmail(),
                money(wallet.getFiatBalance()),
                formatPrices(prices),
                formatHoldings(holdings, prices),
                formatTransactions(transactions),
                request.question().trim()
        );
    }

    private String formatPrices(List<MarketPrice> prices) {
        return prices.stream()
                .map(price -> "%s: price=%s USD, daily_change=%s%%".formatted(
                        price.symbol(),
                        money(price.price()),
                        money(price.changePercent())
                ))
                .reduce((left, right) -> left + "\n" + right)
                .orElse("Canli fiyat yok.");
    }

    private String formatHoldings(List<Holding> holdings, List<MarketPrice> prices) {
        if (holdings.isEmpty()) {
            return "Kripto varlik yok.";
        }

        Map<String, BigDecimal> priceBySymbol = prices.stream()
                .collect(java.util.stream.Collectors.toMap(MarketPrice::symbol, MarketPrice::price));

        return holdings.stream()
                .map(holding -> {
                    BigDecimal price = priceBySymbol.getOrDefault(holding.getSymbol(), BigDecimal.ZERO);
                    BigDecimal value = holding.getQuantity().multiply(price);
                    return "%s: quantity=%s, estimated_value_usd=%s".formatted(
                            holding.getSymbol(),
                            holding.getQuantity().stripTrailingZeros().toPlainString(),
                            money(value)
                    );
                })
                .reduce((left, right) -> left + "\n" + right)
                .orElse("Kripto varlik yok.");
    }

    private String formatTransactions(List<TradeTransaction> transactions) {
        if (transactions.isEmpty()) {
            return "Henuz islem yok.";
        }

        return transactions.stream()
                .map(transaction -> "%s %s quantity=%s price=%s total=%s at=%s".formatted(
                        transaction.getType(),
                        transaction.getSymbol(),
                        transaction.getQuantity().stripTrailingZeros().toPlainString(),
                        money(transaction.getExecutionPrice()),
                        money(transaction.getTotalAmount()),
                        transaction.getCreatedAt()
                ))
                .reduce((left, right) -> left + "\n" + right)
                .orElse("Henuz islem yok.");
    }

    private String extractAnswer(Map<String, Object> response) {
        if (response == null) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY, "AI service returned an empty response");
        }

        Object candidatesObject = response.get("candidates");
        if (!(candidatesObject instanceof List<?> candidates) || candidates.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY, "AI service returned no answer");
        }

        Object firstCandidate = candidates.get(0);
        if (!(firstCandidate instanceof Map<?, ?> candidate)) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY, "AI service returned an invalid answer");
        }

        Object contentObject = candidate.get("content");
        if (!(contentObject instanceof Map<?, ?> content)) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY, "AI service returned an invalid answer");
        }

        Object partsObject = content.get("parts");
        if (!(partsObject instanceof List<?> parts) || parts.isEmpty()) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY, "AI service returned an invalid answer");
        }

        Object firstPart = parts.get(0);
        if (!(firstPart instanceof Map<?, ?> part)) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY, "AI service returned an invalid answer");
        }

        Object textObject = part.get("text");
        if (!(textObject instanceof String text) || !StringUtils.hasText(text)) {
            throw new BusinessException(HttpStatus.BAD_GATEWAY, "AI service returned an empty answer");
        }

        return text.trim();
    }

    private String money(BigDecimal value) {
        return value.stripTrailingZeros().toPlainString();
    }
}
