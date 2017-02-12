BUILD=./src/build.sh

all:
	$(BUILD)

watch:
	fswatch -o ./src | xargs -n1 $(BUILD)