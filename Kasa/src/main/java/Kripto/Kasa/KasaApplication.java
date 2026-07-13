package Kripto.Kasa;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class KasaApplication {

	public static void main(String[] args) {
		SpringApplication.run(KasaApplication.class, args);
	}

}
