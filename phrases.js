// フレーズデータ（学習履歴とは別ファイル）。S=しゅご V=どうさ O=ひとこと。
// 追加するときは各リストの「最後」に足すこと（IDは並び順で S1,S2... と決まるため、途中に入れたり並べ替えると学習履歴がずれます）。
const RAW={
S:`私は〜したい|I want to ...|I want to play soccer.|サッカーをしたい。
私は〜するつもり|I’m going to ...|I’m going to eat lunch.|おひるごはんを食べるよ。
私は〜できる|I can ...|I can ride a bike.|自転車にのれるよ。
私は〜が好き|I like ...|I like dogs.|犬が好き。
私は〜を持っている|I have ...|I have a new pen.|新しいペンを持ってるよ。
〜しよう|Let’s ...|Let’s play together.|いっしょにあそぼう。
〜してもいい？|Can I ...?|Can I have some water?|お水をもらってもいい？
〜してくれる？|Can you ...?|Can you help me?|手伝ってくれる？
私は〜が好きじゃない|I don’t like ...|I don’t like carrots.|にんじんは好きじゃない。
〜がある・いる|There is ...|There is a cat.|ねこがいるよ。
私は〜に行く|I go to ...|I go to school.|学校に行くよ。
私は〜が見える|I see ...|I see a bird.|鳥が見えるよ。
私は〜じゃない|I’m not ...|I’m not scared.|こわくないよ。
私は〜だよ（気もち）|I’m ...|I’m happy.|うれしいよ。
これは〜です|This is ...|This is my bag.|これは私のかばんだよ。
私は〜がとくい|I’m good at ...|I’m good at drawing.|絵がとくいだよ。
私は〜するよ|I will ...|I will help you.|手伝うよ。
私は〜が大好き|I love ...|I love pizza.|ピザが大好き。
私は〜を知ってる|I know ...|I know that song.|その歌、知ってるよ。
〜だと思う|I think ...|I think it’s fun.|おもしろいと思う。`,
V:`じゅんびする|get ready|Let’s get ready for school.|学校のじゅんびをしよう。
見てみる|take a look|Take a look at this!|これ見てみて！
楽しむ|have fun|Have fun at the park!|公園で楽しんでね！
手をあらう|wash my hands|I wash my hands before lunch.|ごはんの前に手をあらうよ。
ねる|go to bed|I go to bed at nine.|9時にねるよ。
起きる|wake up|I wake up at seven.|7時に起きるよ。
着がえる|get dressed|I get dressed fast.|はやく着がえるよ。
歯をみがく|brush my teeth|I brush my teeth every day.|毎日歯をみがくよ。
〜を待つ|wait for ...|Wait for me!|待ってー！
手伝う|help me|Please help me.|手伝ってください。
〜を聞く|listen to ...|I listen to music.|音楽を聞くよ。
ちょっと休む|take a break|Let’s take a break.|ちょっと休もう。
やってみる|give it a try|Give it a try!|やってみよう！
かたづける|clean up|Let’s clean up the room.|お部屋をかたづけよう。
〜とあそぶ|play with ...|I play with my friends.|友だちとあそぶよ。
こっちに来る|come here|Come here, please.|こっちに来てね。
〜を見つける|find ...|I can find it!|見つけた！
はじめる|get started|Let’s get started.|はじめよう。
お昼ごはんを食べる|have lunch|We have lunch at noon.|お昼にごはんを食べるよ。
外に出る|go out|Let’s go out and play.|外に出てあそぼう。`,
O:`もちろん。|Of course.|Of course! Come in.|もちろん！入って。
ぜんぜんいいよ。|Not at all.|Not at all. I like it.|ぜんぜんいいよ。すきだよ。
ところで、|By the way, ...|By the way, what’s your name?|ところで、名前は何？
ありがとう。|Thank you.|Thank you for the gift.|プレゼントありがとう。
どういたしまして。|You’re welcome.|You’re welcome! Here you go.|どういたしまして！はい、どうぞ。
よくできたね！|Good job!|Good job, Mika!|よくできたね、ミカ！
またあとでね。|See you later.|Bye! See you later.|バイバイ！またあとでね。
私もだよ。|Me too.|I like cats. Me too!|ねこが好き。私もだよ！
ちょっと待ってね。|Just a moment.|Just a moment, please.|ちょっと待ってね。
だいじょうぶだよ。|No problem.|It’s OK. No problem.|いいよ。だいじょうぶだよ。
がんばってね！|Good luck!|Good luck on the test!|テスト、がんばってね！
はじめまして。|Nice to meet you.|Hi, I’m Ken. Nice to meet you.|こんにちは、ケンだよ。はじめまして。`
};
