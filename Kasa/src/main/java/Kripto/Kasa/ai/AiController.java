package Kripto.Kasa.ai;

import Kripto.Kasa.auth.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AiController {
    private final AuthService authService;
    private final AiService aiService;

    public AiController(AuthService authService, AiService aiService) {
        this.authService = authService;
        this.aiService = aiService;
    }

    @PostMapping("/query")
    public AiQueryResponse query(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @Valid @RequestBody AiQueryRequest request
    ) {
        Long userId = authService.requireUserId(authorizationHeader);
        return aiService.answer(userId, request);
    }
}
