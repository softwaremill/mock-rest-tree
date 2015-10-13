lint:
	@./node_modules/.bin/eslint "**/*.js"

test:
	@./node_modules/.bin/mocha

.PHONY: lint test