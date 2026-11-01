import { initBotId } from "botid/client/core";

// Tells BotID which requests to attach its invisible challenge to. A route that
// is not listed here sends no challenge, and checkBotId() on the server then
// treats its requests as bots. The checkLevel must be the same as the one the
// route passes to checkBotId().
initBotId({
  protect: [
    {
      path: "/api/pdf",
      method: "POST",
      advancedOptions: { checkLevel: "basic" },
    },
  ],
});
