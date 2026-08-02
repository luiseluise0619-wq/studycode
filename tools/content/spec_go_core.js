/* Go 는 러너(tools/runner)가 go test 로 채점한다. 브라우저 안에서는 돌지 않는다. */
module.exports = { track: "go", lang: "go", runner: true, source: "./go_core.js" };
