package Kripto.Kasa.portfolio;

import Kripto.Kasa.auth.AuthService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/portfolio")
public class PortfolioController {
    private final AuthService authService;
    private final PortfolioService portfolioService;

    public PortfolioController(AuthService authService, PortfolioService portfolioService) {
        this.authService = authService;
        this.portfolioService = portfolioService;
    }

    @GetMapping
    public PortfolioResponse portfolio(@RequestHeader("Authorization") String authorizationHeader) {
        Long userId = authService.requireUserId(authorizationHeader);
        return portfolioService.getPortfolio(userId);
    }
}
