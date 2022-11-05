const token = "your_token";
const baseUrl = "https://viacep.com.br/ws/";
import { Telegraf, Composer, Scenes, Markup, session } from "telegraf";
import fetch from "node-fetch";

const bot = new Telegraf(token);
let cep;

const Stage = Scenes.Stage;

const cepHandler = new Composer();

cepHandler.hears(/^[0-9]{5}-[0-9]{3}$/, (ctx) => {
  cep = ctx.match["input"];
  ctx.reply("OK, isto que você me enviou é um CEP. Vamos dar uma olhadinha...");
  ctx.wizard.next();

  return ctx.wizard.steps[ctx.wizard.cursor](ctx);
});

cepHandler.use(async (ctx) => {
  const msg = ctx.message.text;
  await ctx.reply(`A sua mensagem foi '${msg}'. Não me parece ser um CEP...`);
  await ctx.reply("Lembre-se de inserir o CEP no formato 12345-678, tá bom?");
});

const fetchCep = async (cep) => {
  const fetchUrl = `${baseUrl}\\${cep}\\json`;

  let json = fetch(fetchUrl).then((res) => res.json());
  return json;
};

// fetchCep("38408-648");

const cepScene = new Scenes.WizardScene(
  "cep",
  (ctx) => {
    ctx.reply(
      "Então, eu sou um bot que busca endereços por CEP. Digita o CEP que você quiser logo abaixo e vou puxar para você"
    );

    ctx.wizard.next();
  },
  cepHandler,
  async (ctx) => {
    const response = await fetchCep(cep);

    const responseText = `
    
      Logradouro: ${response["logradouro"]}
    Bairro: ${response["bairro"]}
    Cidade: ${response["localidade"]}
    Estado: ${response["uf"]}
    DDD: ${response["ddd"]}

    `;

    await ctx.reply(responseText);
    await ctx.reply("Fique à vontade para digitar mais algum CEP...");
    ctx.wizard.back();
  }
);

const stage = new Scenes.Stage([cepScene]);

bot.use(session());
bot.use(stage.middleware());
bot.start(Stage.enter("cep"));

bot.command("sobre", async (ctx) => {
  await ctx.reply(
    "Eu sou um bot feito para propósitos de treino do meu autor, o Robert."
  );
  await ctx.reply(
    'Aqui usamos o conceito de consumo de api por meio de fetch, usando promises. Além de usar o módulo "Telegraf" para o Telegram.'
  );
  await ctx.replyWithHTML(`<a href='https://google.com'>Teste</a>`);
});
bot.use((ctx) => {
  const first_name = ctx.update.message.from.first_name;
  ctx.reply(
    `Opa, ${first_name}. Como vai você?\n\nEu sou um BOT feito para verificar endereços por trás de CEP's. \n\nDigita /start pra gente começar :)`
  );
  ctx.reply(
    "Se quiser saber um pouquinho mais sobre mim, pode usar o comando /sobre."
  );
});

bot.startPolling();
