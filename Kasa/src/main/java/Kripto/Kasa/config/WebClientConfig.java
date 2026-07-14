package Kripto.Kasa.config;

import Kripto.Kasa.market.MarketProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Bean
    public WebClient.Builder webClientBuilder() {
        return WebClient.builder();
    }

    @Bean
    public WebClient marketWebClient(MarketProperties properties, WebClient.Builder webClientBuilder) {
        return webClientBuilder
                .baseUrl(properties.getBaseUrl())
                .build();
    }
}
