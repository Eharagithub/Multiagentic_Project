package com.agentic.agentic_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import io.github.cdimascio.dotenv.Dotenv;

@SpringBootApplication
public class AgenticBackendApplication {

	public static void main(String[] args) {
		// Load .env from spring_backend directory and set as system properties
		Dotenv dotenv = Dotenv.configure()
				.directory(".") // current directory is spring_backend
				.ignoreIfMissing()
				.load();

		// Set system properties from .env file
		if (dotenv.get("NEO4J_URI") != null) {
			System.setProperty("spring.neo4j.uri", dotenv.get("NEO4J_URI"));
		}
		if (dotenv.get("NEO4J_USER") != null) {
			System.setProperty("spring.neo4j.authentication.username", dotenv.get("NEO4J_USER"));
		}
		if (dotenv.get("NEO4J_PASSWORD") != null) {
			System.setProperty("spring.neo4j.authentication.password", dotenv.get("NEO4J_PASSWORD"));
		}

		SpringApplication.run(AgenticBackendApplication.class, args);
	}

}
