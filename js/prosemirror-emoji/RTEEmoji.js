
const emojiList = {
    ":grinning:": ["&#x1f600"], //No I18N
    // ":happy:": ["&#x1f600"], //No I18N
    ":grin:": ["&#x1f601"], //No I18N
    ":joy:": ["&#x1f602"], //No I18N
    ":smiley:": ["&#x1f603"], //No I18N
    ":smile:": ["&#x1f604"], //No I18N
    ":sweat-smile:": ["&#x1f605"], //No I18N
    ":laughing:": ["&#x1f606"], //No I18N
    ":wink:": ["&#x1f609"], //No I18N
    ":blush:": ["&#x1f60a"], //No I18N
    ":yum:": ["&#x1f60b"], //No I18N
    ":sunglasses:": ["&#x1f60e"], //No I18N
    // ":cool:": ["&#x1f60e"], //No I18N
    ":heart-eyes:": ["&#x1f60d"], //No I18N
    // ":love:": ["&#x1f60d"], //No I18N
    ":kissing-heart:": ["&#x1f618"], //No I18N
    ":kissing:": ["&#x1f617"], //No I18N
    ":kissing-smiling-eyes:": ["&#x1f619"], //No I18N
    ":kissing-closed-eyes:": ["&#x1f61a"], //No I18N
    ":slight-smile:": ["&#x1f642"], //No I18N
    ":hug:": ["&#x1f917"], //No I18N
    ":thinking:": ["&#x1f914"], //No I18N
    ":neutral-face:": ["&#x1f610"], //No I18N
    ":expressionless:": ["&#x1f611"], //No I18N
    ":no-mouth:": ["&#x1f636"], //No I18N
    ":rolling-eyes:": ["&#x1f644"], //No I18N
    ":smirk:": ["&#x1f60f"], //No I18N
    ":persevere:": ["&#x1f623"], //No I18N
    ":cry:": ["&#x1f622"], //No I18N
    ":open-mouth:": ["&#x1f62e"], //No I18N
    ":zipper-mouth:": ["&#x1f910"], //No I18N
    ":hushed:": ["&#x1f62f"], //No I18N
    ":sleepy:": ["&#x1f62a"], //No I18N
    ":tired-face:": ["&#x1f62b"], //No I18N
    // ":tired:": ["&#x1f62b"], //No I18N
    ":sleeping:": ["&#x1f634"], //No I18N
    ":relieved:": ["&#x1f60c"], //No I18N
    // ":relaxed:": ["&#x1f60c"], //No I18N
    ":stuck-out-tongue:": ["&#x1f61b"], //No I18N
    ":stuck-out-tongue-winking-eye:": ["&#x1f61c"], //No I18N
    ":stuck-out-tongue-closed-eyes:": ["&#x1f61d"], //No I18N
    // ":razz:": ["&#x1f61d"], //No I18N
    ":unamused:": ["&#x1f612"], //No I18N
    ":sweat:": ["&#x1f613"], //No I18N
    ":pensive:": ["&#x1f614"], //No I18N
    ":confused:": ["&#x1f615"], //No I18N
    ":upside-down:": ["&#x1f643"], //No I18N
    ":money-mouth:": ["&#x1f911"], //No I18N
    ":astonished:": ["&#x1f632"], //No I18N
    // ":surprise:": ["&#x1f632"], //No I18N
    ":slight-frowning:": ["&#x1f641"], //No I18N
    ":sad:": ["&#x1f641"], //No I18N
    ":confounded:": ["&#x1f616"], //No I18N
    // ":stressed-out:": ["&#x1f616"], //No I18N
    ":disappointed:": ["&#x1f61e"], //No I18N
    ":worried:": ["&#x1f61f"], //No I18N
    // ":worry:": ["&#x1f61f"], //No I18N
    ":triumph:": ["&#x1f624"], //No I18N
    ":disappointed-relieved:": ["&#x1f625"], //No I18N
    // ":anxious:": ["&#x1f625"], //No I18N
    ":sob:": ["&#x1f62d"], //No I18N
    ":frowning-with-open-mouth:": ["&#x1f626"], //No I18N
    ":anguished:": ["&#x1f627"], //No I18N
    ":fearful:": ["&#x1f628"], //No I18N
    ":weary:": ["&#x1f629"], //No I18N
    ":grimacing:": ["&#x1f62c"], //No I18N
    ":cold-sweat:": ["&#x1f630"], //No I18N
    ":scream:": ["&#x1f631"], //No I18N
    ":flushed:": ["&#x1f633"], //No I18N
    ":dizzy-face:": ["&#x1f635"], //No I18N
    // ":faint:": ["&#x1f635"], //No I18N
    ":rage:": ["&#x1f621"], //No I18N
    ":angry:": ["&#x1f620"], //No I18N
    ":mask:": ["&#x1f637"], //No I18N
    ":sick:": ["&#x1f912"], //No I18N
    ":head-bandaged:": ["&#x1f915"], //No I18N
    ":halo-smiling:": ["&#x1f607"], //No I18N
    // ":peace:": ["&#x1f607"], //No I18N
    ":nerd:": ["&#x1f913"], //No I18N
    ":smiling-with-horns:": ["&#x1f608"], //No I18N
    ":imp:": ["&#x1f47f"], //No I18N
    ":japanese-ogre:": ["&#x1f479"], //No I18N
    ":japanese-goblin:": ["&#x1f47a"], //No I18N
    ":skull:": ["&#x1f480"], //No I18N
    ":ghost:": ["&#x1f47b"], //No I18N
    ":alien:": ["&#x1f47d"], //No I18N
    ":robot:": ["&#x1f916"], //No I18N
    ":hankey:": ["&#x1f4a9"], //No I18N
    ":smiley-cat:": ["&#x1f63a"], //No I18N
    ":smile-cat:": ["&#x1f638"], //No I18N
    ":joy-cat:": ["&#x1f639"], //No I18N
    ":heart-eyes-cat:": ["&#x1f63b"], //No I18N
    ":smirk-cat:": ["&#x1f63c"], //No I18N
    ":kissing-cat:": ["&#x1f63d"], //No I18N
    ":scream-cat:": ["&#x1f640"], //No I18N
    ":crying-cat-face:": ["&#x1f63f"], //No I18N
    ":pouting-cat:": ["&#x1f63e"], //No I18N

    ":baby:": ["&#x1f476"], //No I18N
    ":girl:": ["&#x1f467"], //No I18N
    ":boy:": ["&#x1f466"], //No I18N
    ":woman:": ["&#x1f469"], //No I18N
    ":man:": ["&#x1f468"], //No I18N
    ":older-woman:": ["&#x1f475"], //No I18N
    ":older-man:": ["&#x1f474"], //No I18N
    ":man-with-gua-pi-mao:": ["&#x1f472"], //No I18N

    ":man-with-turban:": ["&#x1f473"], //No I18N
    ":person-with-blond-hair:": ["&#x1f471"], //No I18N

    ":cop:": ["&#x1f46e"], //No I18N
    ":construction-worker:": ["&#x1f477"], //No I18N
    ":guardsman:": ["&#x1f482"], //No I18N
    ":detective:": ["&#x1f575"], //No I18N

    ":bride-in-veil:": ["&#x1f470"], //No I18N
    ":princess:": ["&#x1f478"], //No I18N
    ":santa:": ["&#x1f385"], //No I18N

    ":angel:": ["&#x1f47c"], //No I18N
    ":bow:": ["&#x1f647"], //No I18N
    ":information-desk-person:": ["&#x1f481"], //No I18N
    ":no-good:": ["&#x1f645"], //No I18N
    ":ok-woman:": ["&#x1f646"], //No I18N
    ":raising-hand:": ["&#x1f64b"], //No I18N
    ":person-with-pouting-face:": ["&#x1f64e"], //No I18N
    ":person-frowning:": ["&#x1f64d"], //No I18N
    ":haircut:": ["&#x1f487"], //No I18N
    ":massage:": ["&#x1f486"], //No I18N

    ":nail-care:": ["&#x1f485"], //No I18N
    ":dancer:": ["&#x1f483"], //No I18N
    ":dancers:": ["&#x1f46f"], //No I18N
    ":levitating-man:": ["&#x1f574"], //No I18N
    ":walking:": ["&#x1f6b6"], //No I18N
    ":runner:": ["&#x1f3c3"], //No I18N

    ":couple:": ["&#x1f46b"], //No I18N
    ":boys:": ["&#x1f46c"], //No I18N
    ":girls:": ["&#x1f46d"], //No I18N
    ":couplekiss:": ["&#x1f48f"], //No I18N
    ":couple-with-heart:": ["&#x1f491"], //No I18N
    ":boyskiss:": [ //No I18N
        "&#x1f468", //No I18N
        "&#x200d", //No I18N
        "&#x2764", //No I18N
        "&#xfe0f", //No I18N
        "&#x200d", //No I18N
        "&#x1f48b", //No I18N
        "&#x200d", //No I18N
        "&#x1f468" //No I18N
    ],         
    ":boys-with-heart:": [ //No I18N
        "&#x1f468", //No I18N
        "&#x200d", //No I18N
        "&#x2764", //No I18N
        "&#xfe0f", //No I18N
        "&#x200d", //No I18N
        "&#x1f468" //No I18N
    ], 
    ":girlskiss:": [ //No I18N
        "&#x1f469", //No I18N
        "&#x200d", //No I18N
        "&#x2764", //No I18N
        "&#xfe0f", //No I18N
        "&#x200d", //No I18N
        "&#x1f48b", //No I18N
        "&#x200d", //No I18N
        "&#x1f469" //No I18N
    ], 
    ":girls-with-heart:": [ //No I18N
        "&#x1f469", //No I18N
        "&#x200d", //No I18N
        "&#x2764", //No I18N
        "&#xfe0f", //No I18N
        "&#x200d", //No I18N
        "&#x1f469" //No I18N
    ],

    ":family:": ["&#x1f46a"], //No I18N
    ":family-man-woman-girl:": [ //No I18N
        "&#x1f468", //No I18N
        "&#x200d", //No I18N
        "&#x1f469", //No I18N
        "&#x200d", //No I18N
        "&#x1f467" //No I18N
    ], 
    ":family-man-woman-girl-boy:": [ //No I18N
        "&#x1f468", //No I18N
        "&#x200d", //No I18N
        "&#x1f469", //No I18N
        "&#x200d", //No I18N
        "&#x1f467", //No I18N
        "&#x200d", //No I18N
        "&#x1f466" //No I18N
    ], 
    ":family-man-woman-boy-boy:": [ //No I18N
        "&#x1f468", //No I18N
        "&#x200d", //No I18N
        "&#x1f469", //No I18N
        "&#x200d", //No I18N
        "&#x1f466", //No I18N
        "&#x200d", //No I18N
        "&#x1f466" //No I18N
    ],
    ":family-man-woman-girl-girl:": [ //No I18N
        "&#x1f468", //No I18N
        "&#x200d", //No I18N
        "&#x1f469", //No I18N
        "&#x200d", //No I18N
        "&#x1f467", //No I18N
        "&#x200d", //No I18N
        "&#x1f467" //No I18N
    ], 

    ":family-man-man-boy:": [ //No I18N
        "&#x1f468", //No I18N
        "&#x200d", //No I18N
        "&#x1f468", //No I18N
        "&#x200d", //No I18N
        "&#x1f466" //No I18N
    ],
    ":family-man-man-girl:": [ //No I18N
        "&#x1f468", //No I18N
        "&#x200d", //No I18N
        "&#x1f468", //No I18N
        "&#x200d", //No I18N
        "&#x1f467" //No I18N
    ], 

    ":family-man-man-girl-boy:": [ //No I18N
        "&#x1f468", //No I18N
        "&#x200d", //No I18N
        "&#x1f468", //No I18N
        "&#x200d", //No I18N
        "&#x1f467", //No I18N
        "&#x200d", //No I18N
        "&#x1f466" //No I18N
    ], 
    ":family-man-man-boy-boy:": [ //No I18N
        "&#x1f468", //No I18N
        "&#x200d", //No I18N
        "&#x1f468", //No I18N
        "&#x200d", //No I18N
        "&#x1f466", //No I18N
        "&#x200d", //No I18N
        "&#x1f466" //No I18N
    ], 
    ":family-man-man-girl-girl:": [ //No I18N
        "&#x1f468", //No I18N
        "&#x200d", //No I18N
        "&#x1f468", //No I18N
        "&#x200d", //No I18N
        "&#x1f467", //No I18N
        "&#x200d", //No I18N
        "&#x1f467" //No I18N
    ], 

    ":family-woman-woman-girl-boy:": [ //No I18N
        "&#x1f469", //No I18N
        "&#x200d", //No I18N
        "&#x1f469", //No I18N
        "&#x200d", //No I18N
        "&#x1f467", //No I18N
        "&#x200d", //No I18N
        "&#x1f466" //No I18N
    ],
    ":family-woman-woman-boy-boy:": [ //No I18N
        "&#x1f469", //No I18N
        "&#x200d", //No I18N
        "&#x1f469", //No I18N
        "&#x200d", //No I18N
        "&#x1f466", //No I18N
        "&#x200d", //No I18N
        "&#x1f466" //No I18N
    ], 
    ":family-woman-woman-girl-girl:": [ //No I18N
        "&#x1f469", //No I18N
        "&#x200d", //No I18N
        "&#x1f469", //No I18N
        "&#x200d", //No I18N
        "&#x1f467", //No I18N
        "&#x200d", //No I18N
        "&#x1f467" //No I18N
    ],
    ":family-woman-woman-boy:": [ //No I18N
        "&#x1f469", //No I18N
        "&#x200d", //No I18N
        "&#x1f469", //No I18N
        "&#x200d", //No I18N
        "&#x1f466" //No I18N
    ],
    ":family-woman-woman-girl:": [ //No I18N
        "&#x1f469", //No I18N
        "&#x200d", //No I18N
        "&#x1f469", //No I18N
        "&#x200d", //No I18N
        "&#x1f467" //No I18N
    ],

    ":see-no-evil:": ["&#x1f648"], //No I18N
    ":hear-no-evil:": ["&#x1f649"], //No I18N
    ":speak-no-evil:": ["&#x1f64a"], //No I18N
    ":fire:": ["&#x1f525"], //No I18N
    ":sparkles:": ["&#x2728"], //No I18N
    ":star2:": ["&#x1f31f"], //No I18N
    ":droplet:": ["&#x1f4a7"], //No I18N
    ":tophat:": ["&#x1f3a9"], //No I18N
    ":crown:": ["&#x1f451"], //No I18N
    ":womans-hat:": ["&#x1f452"], //No I18N
    ":athletic-shoe:": ["&#x1f45f"], //No I18N
    ":mans-shoe:": ["&#x1f45e"], //No I18N
    ":sandal:": ["&#x1f461"], //No I18N
    ":high-heel:": ["&#x1f460"], //No I18N
    ":boot:": ["&#x1f462"], //No I18N
    ":shirt:": ["&#x1f455"], //No I18N
    ":necktie:": ["&#x1f454"], //No I18N
    ":womans-clothes:": ["&#x1f45a"], //No I18N
    ":dress:": ["&#x1f457"], //No I18N
    ":running-shirt-with-sash:": ["&#x1f3bd"], //No I18N
    ":jeans:": ["&#x1f456"], //No I18N
    ":kimono:": ["&#x1f458"], //No I18N
    ":bikini:": ["&#x1f459"], //No I18N
    ":briefcase:": ["&#x1f4bc"], //No I18N
    ":handbag:": ["&#x1f45c"], //No I18N
    ":pouch:": ["&#x1f45d"], //No I18N
    ":purse:": ["&#x1f45b"], //No I18N
    ":eyeglasses:": ["&#x1f453"], //No I18N
    ":ribbon:": ["&#x1f380"], //No I18N
    ":closed-umbrella:": ["&#x1f302"], //No I18N

    ":gem:": ["&#x1f48e"], //No I18N
    ":speech-balloon:": ["&#x1f4ac"], //No I18N
    ":open-hands:": ["&#x1f450"], //No I18N
    ":raised-hands:": ["&#x1f64c"], //No I18N
    ":clap:": ["&#x1f44f"], //No I18N
    // ":thumbs-up:": ["&#x1f44d"], //No I18N
    ":thumbsup:": ["&#x1f44d"], //No I18N
    // ":thumbs-down:": ["&#x1f44e"], //No I18N
    ":thumbsdown:": ["&#x1f44e"], //No I18N
    ":oncoming-fist:": ["&#x1f44A"], //No I18N
    ":fist:": ["&#x270A"], //No I18N
    ":sign-of-horns:": ["&#x1f918"], //No I18N
    ":ok-hand:": ["&#x1f44c"], //No I18N
    ":point-left:": ["&#x1f448"], //No I18N
    ":point-right:": ["&#x1f449"], //No I18N
    ":point-up-2:": ["&#x1f446"], //No I18N
    ":point-down:": ["&#x1f447"], //No I18N
    ":raised-hand:": ["&#x270B"], //No I18N
    ":spayed-fingers:": ["&#x1f590"], //No I18N
    ":vulcan-salute:": ["&#x1f596"], //No I18N
    ":wave:": ["&#x1f44b"], //No I18N
    ":muscle:": ["&#x1f4aa"], //No I18N
    ":middle-finger:": ["&#x1f595"], //No I18N
    ":pray:": ["&#x1f64f"], //No I18N
    ":ring:": ["&#x1f48d"], //No I18N
    ":lipstick:": ["&#x1f484"], //No I18N
    ":kiss:": ["&#x1f48b"], //No I18N
    ":lips:": ["&#x1f444"], //No I18N
    ":tongue:": ["&#x1f445"], //No I18N
    ":ear:": ["&#x1f442"], //No I18N
    ":nose:": ["&#x1f443"], //No I18N
    ":footprints:": ["&#x1f463"], //No I18N
    ":eye:": ["&#x1f441"], //No I18N
    ":eyes:": ["&#x1f440"], //No I18N
    ":speaking-head:": ["&#x1f5e3"], //No I18N
    ":bust-in-silhouette:": ["&#x1f464"], //No I18N
    ":busts-in-silhouette:": ["&#x1f465"], //No I18N

    ":dog:": ["&#x1f436"], //No I18N
    ":wolf:": ["&#x1f43a"], //No I18N
    ":cat:": ["&#x1f431"], //No I18N
    ":mouse:": ["&#x1f42d"], //No I18N
    ":hamster:": ["&#x1f439"], //No I18N
    ":rabbit:": ["&#x1f430"], //No I18N
    ":frog:": ["&#x1f438"], //No I18N
    ":tiger:": ["&#x1f42f"], //No I18N
    ":koala:": ["&#x1f428"], //No I18N
    ":bear:": ["&#x1f43b"], //No I18N
    ":pig:": ["&#x1f437"], //No I18N
    ":pig-nose:": ["&#x1f43d"], //No I18N
    ":cow:": ["&#x1f42e"], //No I18N
    ":boar:": ["&#x1f417"], //No I18N
    ":monkey-face:": ["&#x1f435"], //No I18N
    ":monkey:": ["&#x1f412"], //No I18N
    ":horse:": ["&#x1f434"], //No I18N
    ":sheep:": ["&#x1f411"], //No I18N
    ":elephant:": ["&#x1f418"], //No I18N
    ":panda-face:": ["&#x1f43c"], //No I18N
    ":penguin:": ["&#x1f427"], //No I18N
    ":bird:": ["&#x1f426"], //No I18N
    ":baby-chick:": ["&#x1f424"], //No I18N
    ":hatched-chick:": ["&#x1f425"], //No I18N
    ":hatching-chick:": ["&#x1f423"], //No I18N
    ":chicken:": ["&#x1f414"], //No I18N
    ":snake:": ["&#x1f40d"], //No I18N
    ":turtle:": ["&#x1f422"], //No I18N
    ":bug:": ["&#x1f41b"], //No I18N
    ":bee:": ["&#x1f41d"], //No I18N
    ":ant:": ["&#x1f41c"], //No I18N
    ":beetle:": ["&#x1f41e"], //No I18N
    ":snail:": ["&#x1f40c"], //No I18N
    ":octopus:": ["&#x1f419"], //No I18N
    ":shell:": ["&#x1f41a"], //No I18N
    ":tropical-fish:": ["&#x1f420"], //No I18N
    ":fish:": ["&#x1f41f"], //No I18N
    ":dolphin:": ["&#x1f42c"], //No I18N
    ":whale:": ["&#x1f433"], //No I18N
    ":racehorse:": ["&#x1f40e"], //No I18N
    ":dragon-face:": ["&#x1f432"], //No I18N
    ":blowfish:": ["&#x1f421"], //No I18N
    ":camel:": ["&#x1f42b"], //No I18N
    ":poodle:": ["&#x1f429"], //No I18N
    ":feet:": ["&#x1f43e"], //No I18N
    ":bouquet:": ["&#x1f490"], //No I18N
    ":cherry-blossom:": ["&#x1f338"], //No I18N
    ":tulip:": ["&#x1f337"], //No I18N
    ":four-leaf-clover:": ["&#x1f340"], //No I18N
    ":rose:": ["&#x1f339"], //No I18N
    ":sunflower:": ["&#x1f33b"], //No I18N
    ":hibiscus:": ["&#x1f33a"], //No I18N
    ":maple-leaf:": ["&#x1f341"], //No I18N
    ":leaves:": ["&#x1f343"], //No I18N
    ":fallen-leaf:": ["&#x1f342"], //No I18N
    ":herb:": ["&#x1f33f"], //No I18N
    ":ear-of-rice:": ["&#x1f33e"], //No I18N
    ":mushroom:": ["&#x1f344"], //No I18N
    ":cactus:": ["&#x1f335"], //No I18N
    ":palm-tree:": ["&#x1f334"], //No I18N
    ":chestnut:": ["&#x1f330"], //No I18N
    ":seedling:": ["&#x1f331"], //No I18N
    ":blossom:": ["&#x1f33c"], //No I18N
    ":new-moon:": ["&#x1f311"], //No I18N
    ":first-quarter-moon:": ["&#x1f313"], //No I18N
    ":moon:": ["&#x1f314"], //No I18N
    ":full-moon:": ["&#x1f315"], //No I18N
    ":first-quarter-moon-with-face:": ["&#x1f31b"], //No I18N
    ":crescent-moon:": ["&#x1f319"], //No I18N
    ":earth-asia:": ["&#x1f30f"], //No I18N
    ":volcano:": ["&#x1f30b"], //No I18N
    ":milky-way:": ["&#x1f30c"], //No I18N
    ":stars:": ["&#x1f320"], //No I18N
    ":partly-sunny:": ["&#x26C5"], //No I18N
    ":snowman:": ["&#x26C4"], //No I18N
    ":cyclone:": ["&#x1f300"], //No I18N
    ":foggy:": ["&#x1f301"], //No I18N
    ":rainbow:": ["&#x1f308"], //No I18N
    ":ocean:": ["&#x1f30a"], //No I18N
    ":house:": ["&#x1f3e0"], //No I18N
    ":house-with-garden:": ["&#x1f3e1"], //No I18N
    ":school:": ["&#x1f3eb"], //No I18N
    ":office:": ["&#x1f3e2"], //No I18N
    ":post-office:": ["&#x1f3e3"], //No I18N
    ":hospital:": ["&#x1f3e5"], //No I18N
    ":bank:": ["&#x1f3e6"], //No I18N
    ":convenience-store:": ["&#x1f3ea"], //No I18N
    ":love-hotel:": ["&#x1f3e9"], //No I18N
    ":hotel:": ["&#x1f3e8"], //No I18N
    ":wedding:": ["&#x1f492"], //No I18N
    ":church:": ["&#x26EA"], //No I18N
    ":department-store:": ["&#x1f3ec"], //No I18N
    ":city-sunrise:": ["&#x1f307"], //No I18N
    ":city-sunset:": ["&#x1f306"], //No I18N
    ":japanese-castle:": ["&#x1f3ef"], //No I18N
    ":european-castle:": ["&#x1f3f0"], //No I18N
    ":tent:": ["&#x26FA"], //No I18N
    ":factory:": ["&#x1f3ed"], //No I18N
    ":tokyo-tower:": ["&#x1f5fc"], //No I18N
    ":japan:": ["&#x1f5fe"], //No I18N
    ":mount-fuji:": ["&#x1f5fb"], //No I18N
    ":sunrise-over-mountains:": ["&#x1f304"], //No I18N
    ":sunrise:": ["&#x1f305"], //No I18N
    ":night-with-stars:": ["&#x1f303"], //No I18N
    ":statue-of-liberty:": ["&#x1f5fd"], //No I18N
    ":bridge-at-night:": ["&#x1f309"], //No I18N
    ":carousel-horse:": ["&#x1f3a0"], //No I18N
    ":ferris-wheel:": ["&#x1f3a1"], //No I18N
    ":fountain:": ["&#x26F2"], //No I18N
    ":roller-coaster:": ["&#x1f3a2"], //No I18N
    ":ship:": ["&#x1f6a2"], //No I18N
    ":boat:": ["&#x26F5"], //No I18N
    ":speedboat:": ["&#x1f6a4"], //No I18N
    ":rocket:": ["&#x1f680"], //No I18N
    ":seat:": ["&#x1f4ba"], //No I18N
    ":station:": ["&#x1f689"], //No I18N
    ":high-speed-train:": ["&#x1f684"], //No I18N
    ":bullet-train:": ["&#x1f685"], //No I18N
    ":metro:": ["&#x1f687"], //No I18N
    ":railway-car:": ["&#x1f683"], //No I18N
    ":bus:": ["&#x1f68c"], //No I18N
    ":blue-car:": ["&#x1f699"], //No I18N
    ":car:": ["&#x1f697"], //No I18N
    ":taxi:": ["&#x1f695"], //No I18N
    ":truck:": ["&#x1f69a"], //No I18N
    ":rotating-light:": ["&#x1f6a8"], //No I18N
    ":police-car:": ["&#x1f693"], //No I18N
    ":fire-engine:": ["&#x1f692"], //No I18N
    ":ambulance:": ["&#x1f691"], //No I18N
    ":bike:": ["&#x1f6b2"], //No I18N
    ":barber-pole:": ["&#x1f488"], //No I18N
    ":busstop:": ["&#x1f68f"], //No I18N
    ":ticket:": ["&#x1f3ab"], //No I18N
    ":traffic-light:": ["&#x1f6a5"], //No I18N
    ":construction:": ["&#x1f6a7"], //No I18N
    ":beginner:": ["&#x1f530"], //No I18N
    ":fuelpump:": ["&#x26FD"], //No I18N
    ":izakaya-lantern:": ["&#x1f3ee"], //No I18N
    ":slot-machine:": ["&#x1f3b0"], //No I18N
    ":moyai:": ["&#x1f5ff"], //No I18N
    ":circus-tent:": ["&#x1f3aa"], //No I18N
    ":performing-arts:": ["&#x1f3ad"], //No I18N
    ":round-pushpin:": ["&#x1f4cd"], //No I18N
    ":triangular-flag-on-post:": ["&#x1f6a9"], //No I18N

    ":red-heart:": ["&#x2764", "&#xfe0f"], //No I18N
    ":yellow-heart:": ["&#x1f49b"], //No I18N
    ":blue-heart:": ["&#x1f499"], //No I18N
    ":purple-heart:": ["&#x1f49c"], //No I18N
    ":green-heart:": ["&#x1f49a"], //No I18N
    ":broken-heart:": ["&#x1f494"], //No I18N
    ":heart-exclamation:": ["&#x2763", "&#xfe0f"], //No I18N
    ":two-hearts:": ["&#x1f495"], //No I18N
    ":revolving-hearts:": ["&#x1f49e"], //No I18N
    ":heartbeat:": ["&#x1f493"], //No I18N
    ":heartpulse:": ["&#x1f497"], //No I18N
    ":sparkling-heart:": ["&#x1f496"], //No I18N
    ":cupid:": ["&#x1f498"], //No I18N
    ":gift-heart:": ["&#x1f49d"], //No I18N
    ":heart-decoration:": ["&#x1f49f"], //No I18N
    ":love-letter:": ["&#x1f48c"], //No I18N
    ":dizzy:": ["&#x1f4ab"], //No I18N
    ":boom:": ["&#x1f4a5"], //No I18N
    ":anger:": ["&#x1f4a2"], //No I18N
    ":sweat-drops:": ["&#x1f4a6"], //No I18N
    ":zzz:": ["&#x1f4a4"], //No I18N
    ":dash:": ["&#x1f4a8"], //No I18N
    ":hole:": ["&#x1f573", "&#xfe0f"], //No I18N
    ":peace-symbol:": ["&#x262e", "&#xfe0f"], //No I18N
    ":latin-cross:": ["&#x271d", "&#xfe0f"], //No I18N
    ":crescent-and-star:": ["&#x262a", "&#xfe0f"], //No I18N
    ":om:": ["&#x1f549", "&#xfe0f"], //No I18N
    ":wheel-of-dharma:": ["&#x2638", "&#xfe0f"], //No I18N
    ":star-of-david:": ["&#x2721", "&#xfe0f"], //No I18N
    ":star-with-middle-point:": ["&#x1f52f"], //No I18N
    ":menorah:": ["&#x1f54e"], //No I18N
    ":yin-yang:": ["&#x262f", "&#xfe0f"], //No I18N
    ":orthodox-cross:": ["&#x2626", "&#xfe0f"], //No I18N
    ":place-of-workship:": ["&#x1f6d0"], //No I18N
    ":ophiuchus:": ["&#x26ce"], //No I18N
    ":aries:": ["&#x2648"], //No I18N
    ":taurus:": ["&#x2649"], //No I18N
    ":gemini:": ["&#x264a"], //No I18N
    ":cancer:": ["&#x264b"], //No I18N
    ":leo:": ["&#x264c"], //No I18N
    ":virgo:": ["&#x264d"], //No I18N
    ":libra:": ["&#x264e"], //No I18N
    ":scorpius:": ["&#x264f"], //No I18N
    ":sagittarius:": ["&#x2650"], //No I18N
    ":capricorn:": ["&#x2651"], //No I18N
    ":aquarius:": ["&#x2652"], //No I18N
    ":pisces:": ["&#x2653"], //No I18N
    ":squared-id:": ["&#x1f194"], //No I18N
    ":atom:": ["&#x269b", "&#xfe0f"], //No I18N
    ":japanese-vacancy-button:": ["&#x1f233"], //No I18N
    ":japanese-discount-button:": ["&#x1f239"], //No I18N
    ":radioactive:": ["&#x2622", "&#xfe0f"], //No I18N
    ":biohazard:": ["&#x2623", "&#xfe0f"], //No I18N
    ":japanese-not-free-of-charge-button:": ["&#x1f236"], //No I18N
    ":japanese-free-of-charge-button:": ["&#x1f21a"], //No I18N
    ":japanese-application-button:": ["&#x1f238"], //No I18N
    ":japanese-open-for-business-button:": ["&#x1f23a"], //No I18N
    ":japanese-monthly-amount:": ["&#x1f237", "&#xfe0f"], //No I18N
    ":eight-pointed-star:": ["&#x2734", "&#xfe0f"], //No I18N
    ":vs-button:": ["&#x1f19a"], //No I18N
    ":japanese-acceptable-button:": ["&#x1f251"], //No I18N
    ":white-flower:": ["&#x1f4ae"], //No I18N
    ":japanese-bargain-button:": ["&#x1f250"], //No I18N
    ":japanese-secret-button:": ["&#x3299", "&#xfe0f"], //No I18N
    ":japanese-congratulations-button:": ["&#x3297", "&#xfe0f"], //No I18N
    ":japanese-passing-grade-button:": ["&#x1f234"], //No I18N
    ":japanese-no-vacancy-button:": ["&#x1f235"], //No I18N
    ":japanese-prohibited-button:": ["&#x1f232"], //No I18N
    ":baby-symbol:": ["&#x1f6bc"], //No I18N
    ":a-group-blood": ["&#x1f170", "&#xfe0f"], //No I18N
    ":b-group-blood:": ["&#x1f171", "&#xfe0f"], //No I18N
    ":o-group-blood:": ["&#x1f17e", "&#xfe0f"], //No I18N
    ":cl-button:": ["&#x1f191"], //No I18N
    ":sos-button:": ["&#x1f198"], //No I18N
    ":no-entry:": ["&#x26d4"], //No I18N
    ":name-badge:": ["&#x1f4db"], //No I18N
    ":heavy-circle:": ["&#x2b55"], //No I18N
    ":prohibited:": ["&#x1f6ab"], //No I18N
    ":muted:": ["&#x1f507"], //No I18N
    ":bell-with-slash:": ["&#x1f515"], //No I18N
    ":no-smoking:": ["&#x1f6ad"], //No I18N
    ":no-pedestrains:": ["&#x1f6b7"], //No I18N
    ":no-littering:": ["&#x1f6af"], //No I18N
    ":no-bicycle:": ["&#x1f6b3"], //No I18N
    ":non-potable-water:": ["&#x1f6b1"], //No I18N
    ":no-one-under-18:": ["&#x1f51e"], //No I18N
    ":no-mobile-phones:": ["&#x1f4f5"], //No I18N
    ":exclamation-mark:": ["&#x2757"], //No I18N
    ":white-exclamation-mark:": ["&#x2755"], //No I18N
    ":question-mark:": ["&#x2753"], //No I18N
    ":white-question-mark:": ["&#x2754"], //No I18N
    ":hundred-points:": ["&#x1f4af"], //No I18N
    ":dim-button:": ["&#x1f505"], //No I18N
    ":bright-button:": ["&#x1f506"], //No I18N
    ":trident:": ["&#x1f531"], //No I18N
    ":fleur-de-lis:": ["&#x269c", "&#xfe0f"], //No I18N
    ":part-alternation-mark:": ["&#x303d", "&#xfe0f"], //No I18N
    ":warning:": ["&#x26a0", "&#xfe0f"], //No I18N
    ":children-crossing:": ["&#x1f6b8"], //No I18N
    ":japanese-beginner-button:": ["&#x1f530"], //No I18N
    ":recycling:": ["&#x267b", "&#xfe0f"], //No I18N
    ":japanese-reserved-button:": ["&#x1f22f"], //No I18N
    ":chart-increasing-with-yen:": ["&#x1f4b9"], //No I18N
    ":sparkle:": ["&#x2747", "&#xfe0f"], //No I18N
    ":eight-spoked-asterisk:": ["&#x2733", "&#xfe0f"], //No I18N
    ":white-heavy-check-mark:": ["&#x2705"], //No I18N
    ":cross-mark:": ["&#x274c"], //No I18N
    ":diamond-with-dot:": ["&#x1f4a0"], //No I18N
    ":globe-with-meridians:": ["&#x1f310"], //No I18N
    ":circled-m:": ["&#x24c2", "&#xfe0f"], //No I18N
    ":japanese-service-charge-button:": ["&#x1f202", "&#xfe0f"], //No I18N
    ":double-curly-loop:": ["&#x27bf"], //No I18N
    ":passport-control:": ["&#x1f6c2"], //No I18N
    ":customs:": ["&#x1f6c3"], //No I18N
    ":baggage-claim:": ["&#x1f6c4"], //No I18N
    ":left-luggage:": ["&#x1f6c5"], //No I18N
    ":wheel-chair:": ["&#x267f"], //No I18N
    ":water-closet:": ["&#x1f6be"], //No I18N
    ":p-button:": ["&#x1f17f", "&#xfe0f"], //No I18N
    ":potable-water:": ["&#x1f6b0"], //No I18N
    ":men-room:": ["&#x1f6b9"], //No I18N
    ":women-room:": ["&#x1f6ba"], //No I18N
    ":restroom:": ["&#x1f6bb"], //No I18N
    ":litter-in-bin:": ["&#x1f6ae"], //No I18N
    ":antenna-bars:": ["&#x1f4f6"], //No I18N
    ":japanese-here-button:": ["&#x1f201"], //No I18N
    ":ng-button:": ["&#x1f196"], //No I18N
    ":ok-button:": ["&#x1f197"], //No I18N
    ":up-button:": ["&#x1f199"], //No I18N
    ":cool-button:": ["&#x1f192"], //No I18N
    ":new-button:": ["&#x1f195"], //No I18N
    ":free-button:": ["&#x1f193"], //No I18N
    ":input-number:": ["&#x1f522"], //No I18N
    ":pause-button:": ["&#x23f8", "&#xfe0f"], //No I18N

    ":pause-or-play-button:": ["&#x23ef", "&#xfe0f"], //No I18N
    ":stop-button:": ["&#x23f9", "&#xfe0f"], //No I18N
    ":record-button:": ["&#x23fa"], //No I18N
    ":next-track-button:": ["&#x23ed", "&#xfe0f"], //No I18N
    ":last-track-button:": ["&#x23ee", "&#xfe0f"], //No I18N
    ":fast-forward:": ["&#x23e9"], //No I18N
    ":fast-reverse:": ["&#x23ea"], //No I18N
    ":shuffle-tracks-button:": ["&#x1f500"], //No I18N
    ":repeat-button:": ["&#x1f501"], //No I18N
    ":repeat-once-button:": ["&#x1f502"], //No I18N
    ":reverse-button:": ["&#x25c0", "&#xfe0f"], //No I18N
    ":fast-up-button:": ["&#x23eb"], //No I18N
    ":fast-down-button:": ["&#x23ec"], //No I18N
    ":right-arrow:": ["&#x27a1", "&#xfe0f"], //No I18N
    ":left-arrow:": ["&#x2b05", "&#xfe0f"], //No I18N
    ":up-arrow:": ["&#x2b06", "&#xfe0f"], //No I18N
    ":down-arrow:": ["&#x2b07", "&#xfe0f"], //No I18N
    ":up-right-arrow:": ["&#x2197", "&#xfe0f"], //No I18N
    ":down-left-arrow:": ["&#x2199", "&#xfe0f"], //No I18N
    ":counter-clockwise-arrows:": ["&#x1f504"], //No I18N
    ":left-arrow-curving-right:": ["&#x21aa", "&#xfe0f"], //No I18N
    ":right-arrow-curving-left:": ["&#x21a9", "&#xfe0f"], //No I18N
    ":right-arrow-curving-up:": ["&#x2934", "&#xfe0f"], //No I18N
    ":right-arrow-curving-down:": ["&#x2935", "&#xfe0f"], //No I18N
    ":info-button:": ["&#x2139", "&#xfe0f"], //No I18N
    ":input-latin-letters:": ["&#x1f524"], //No I18N
    ":input-latin-lowercase:": ["&#x1f521"], //No I18N
    ":input-latin-uppercase:": ["&#x1f520"], //No I18N
    ":input-symbols:": ["&#x1f523"], //No I18N
    ":play-button:": ["&#x25b6", "&#xfe0f"], //No I18N
    ":eject-button:": ["&#x23cf", "&#xfe0f"], //No I18N
    ":down-right-arrow:": ["&#x2198", "&#xfe0f"], //No I18N
    ":up-left-arrow:": ["&#x2196", "&#xfe0f"], //No I18N
    ":clockwise-vertical-arrows:": ["&#x1f503"], //No I18N
    ":on-arrow:": ["&#x1f51b"], //No I18N
    ":top-arrow:": ["&#x1f51d"], //No I18N
    ":soon-arrow:": ["&#x1f51c"], //No I18N
    ":ballot-box-with-check:": ["&#x2611", "&#xfe0f"], //No I18N
    ":end-arrow:": ["&#x1f51a"], //No I18N
    ":back-arrow:": ["&#x1f519"], //No I18N
    ":wavy-dash:": ["&#x3030", "&#xfe0f"], //No I18N
    ":curly-loop:": ["&#x27b0"], //No I18N
    ":heavy-check-mark:": ["&#x2714", "&#xfe0f"], //No I18N
    ":heavy-dollar-sign:": ["&#x1f4b2"], //No I18N
    ":currency-exchange:": ["&#x1f4b1"], //No I18N
    ":heavy-plus-sign:": ["&#x2795"], //No I18N
    ":heavy-minus-sign:": ["&#x2796"], //No I18N
    ":heavy-multiplication-sign:": ["&#x2716", "&#xfe0f"], //No I18N
    ":heavy-division-sign:": ["&#x2797"], //No I18N
    ":copyright:": ["&#xa9", "&#xfe0f"], //No I18N
    ":registered:": ["&#xae", "&#xfe0f"], //No I18N
    ":trade-mark:": ["&#x2122", "&#xfe0f"], //No I18N
    ":radio-button:": ["&#x1f518"], //No I18N
    ":white-circle:": ["&#x26aa"], //No I18N
    ":black-circle:": ["&#x26ab"], //No I18N
    ":red-circle:": ["&#x1f534"], //No I18N
    ":blue-circle:": ["&#x1f535"], //No I18N
    ":small-orange-diamond:": ["&#x1f538"], //No I18N
    ":small-blue-diamond:": ["&#x1f539"], //No I18N
    ":large-orange-diamond:": ["&#x1f536"], //No I18N
    ":large-blue-diamond:": ["&#x1f537"], //No I18N
    ":red-triangle-pointed-up:": ["&#x1f53a"], //No I18N
    ":red-triangle-pointed-down:": ["&#x1f53b"], //No I18N
    ":upwards-button:": ["&#x1f53c"], //No I18N
    ":downwards-button:": ["&#x1f53d"], //No I18N
    ":black-medium-small-square:": ["&#x25fe"], //No I18N
    ":white-medium-small-square:": ["&#x25fd"], //No I18N
    ":black-large-square:": ["&#x2b1b"], //No I18N
    ":white-large-square:": ["&#x2b1c"], //No I18N
    ":black-medium-square:": ["&#x25fc", "&#xfe0f"], //No I18N
    ":white-medium-square:": ["&#x25fb", "&#xfe0f"], //No I18N
    ":black-small-square:": ["&#x25aa", "&#xfe0f"], //No I18N
    ":white-small-square:": ["&#x25ab", "&#xfe0f"], //No I18N
    ":black-square-button:": ["&#x1f533"], //No I18N
    ":white-square-button:": ["&#x1f532"], //No I18N

    ":twelve-o-clock:": ["&#x1f55b"], //No I18N
    ":twelve-thirty:": ["&#x1f567"], //No I18N
    ":one-o-clock:": ["&#x1f550"], //No I18N
    ":one-thirty:": ["&#x1f55c"], //No I18N
    ":two-o-clock:": ["&#x1f551"], //No I18N
    ":two-thirty:": ["&#x1f55d"], //No I18N
    ":three-o-clock:": ["&#x1f552"], //No I18N
    ":three-thirty:": ["&#x1f55e"], //No I18N
    ":four-o-clock:": ["&#x1f553"], //No I18N
    ":four-thirty:": ["&#x1f55f"], //No I18N
    ":five-o-clock:": ["&#x1f554"], //No I18N
    ":five-thirty:": ["&#x1f560"], //No I18N
    ":six-o-clock:": ["&#x1f555"], //No I18N
    ":six-thirty:": ["&#x1f561"], //No I18N
    ":seven-o-clock:": ["&#x1f556"], //No I18N
    ":seven-thirty:": ["&#x1f562"], //No I18N
    ":eight-o-clock:": ["&#x1f557"], //No I18N
    ":eight-thirty:": ["&#x1f563"], //No I18N
    ":nine-o-clock:": ["&#x1f558"], //No I18N
    ":nine-thirty:": ["&#x1f564"], //No I18N
    ":ten-o-clock:": ["&#x1f559"], //No I18N
    ":ten-thirty:": ["&#x1f565"], //No I18N
    ":eleven-o-clock:": ["&#x1f55a"], //No I18N
    ":eleven-thirty:": ["&#x1f566"], //No I18N

    // added
    ":keep-quiet:": ["&#x1F92B"], //No I18N
    ":victory:": ["&#x0270C"], //No I18N
    ":coffee-cup:":["&#x02615"] //No I18N
};

const shortcuts = {
    ":)": ":smile:", //No I18N
    ":-)": ":smile:", //No I18N
    ":^)": ":smile:", //No I18N
    ":]": ":smile:", //No I18N

    ":(": ":sad:", //No I18N
    ":-(": ":sad:", //No I18N
    ":[": ":sad:", //No I18N

    ":D": ":happy:", //No I18N
    ":d": ":happy:", //No I18N
    ":-D": ":happy:", //No I18N
    ":))": ":happy:", //No I18N
    ":-))": ":happy:", //No I18N

    "X-(": ":angry:", //No I18N
    ":-@": ":angry:", //No I18N
    ":@": ":angry:", //No I18N

    ":P": ":razz:", //No I18N
    ":-p": ":razz:", //No I18N
    ":p": ":razz:", //No I18N

    ";)": ":wink:", //No I18N
    ";-)": ":wink:", //No I18N

    ":/": ":smirk:", //No I18N
    ":-/": ":smirk:", //No I18N

    ":o": ":surprise:", //No I18N
    ":-o": ":surprise:", //No I18N
    ":O": ":surprise:", //No I18N
    ":-O": ":surprise:", //No I18N

    ":-s": ":worry:", //No I18N
    ":s": ":worry:", //No I18N
    ":-S": ":worry:", //No I18N
    ":S": ":worry:", //No I18N

    "I-)": ":sleepy:", //No I18N
    "|-)": ":sleepy:", //No I18N

    ":-X": ":keep-quiet:", //No I18N
    ":-x": ":keep-quiet:", //No I18N
    ":-#": ":keep-quiet:", //No I18N

    "(a)": ":peace:", //No I18N
    "(A)": ":peace:", //No I18N
    "O-)": ":peace:", //No I18N
    "O:)": ":peace:", //No I18N
    "O:-)": ":peace:", //No I18N

    ":+1:": ":thumbsup:", //No I18N
    "(y)": ":thumbsup:", //No I18N
    "(Y)": ":thumbsup:", //No I18N
    ":x-": ":thumbsup:", //No I18N
    ":yes:": ":thumbsup:", //No I18N
    ":agree:": ":thumbsup:", //No I18N
    ":like:": ":thumbsup:", //No I18N
    // ":yes!:": ":thumbsup!:", //No I18N
    // ":agree!:": ":thumbsup!:", //No I18N
    // ":like!:": ":thumbsup!:", //No I18N
    ":-1:": ":thumbsdown:", //No I18N
    "(N)": ":thumbsdown:", //No I18N
    "(n)": ":thumbsdown:", //No I18N
    ":no:": ":thumbsdown:", //No I18N
    ":disagree:": ":thumbsdown:", //No I18N
    ":dislike:": ":thumbsdown:", //No I18N
    // ":no!:": ":thumbsdown!:", //No I18N
    // ":disagree!:": ":thumbsdown!:", //No I18N
    // ":dislike!:": ":thumbsdown!:", //No I18N
    "B-)": ":cool:", //No I18N
    ":xs": ":love:", //No I18N
    ":-?": ":thinking:", //No I18N
    "*-:)": ":idea:", //No I18N
    "-_-": ":relaxed:", //No I18N
    "D:": ":anxious:", //No I18N
    "-.-": ":stressed-out:", //No I18N
    "(=_=)": ":tired:", //No I18N
    "?D": ":doubt:", //No I18N
    "?D": ":thinking:", //No I18N
    "(6.6)": ":faint:", //No I18N
    "(({..}))": ":headache:", //No I18N
    "+o(": ":sick:", //No I18N
    ":-{}": ":feeling-cold:", //No I18N
    ":v:": ":victory:", //No I18N
    "C(_)": ":coffee-cup:" //No I18N
    // ":down-arrow:": ["disagree", "-1", "no", "dislike"], //NO I18N
    // ":up-arrow:": ["agree", "+1", "yes", "like"], //NO I18N
    // ":white-heavy-check-mark:": ["agree", "+1", "yes", "like"], //NO I18N
    // ":cross-mark:": ["disagree", "-1", "no", "dislike"], //NO I18N
    // ":heavy-plus-sign:": ["agree", "+1", "yes", "like"], //NO I18N
    // ":heavy-minus-sign:": ["disagree", "-1", "no", "dislike"] //NO I18N
};


const zomojiList = {
        ":smile:": "zomoji-w-24-smile",    //no i18n
        ":happy:": "zomoji-w-24-happy",  //no i18n
        ":joy:": "zomoji-w-24-joy",  //no i18n
        ":grinning:": "zomoji-w-24-grinning",  //no i18n
        ":cool:": "zomoji-w-24-cool",  //no i18n
        ":love:": "zomoji-w-24-love",  //no i18n
        ":curious:": "zomoji-w-24-curious",  //no i18n
        ":awe:": "zomoji-w-24-awe",  //no i18n
        ":thinking:": "zomoji-w-24-thinking",  //no i18n
        ":search:": "zomoji-w-24-search",  //no i18n
        ":idea:": "zomoji-w-24-idea",  //no i18n
        ":wink:": "zomoji-w-24-wink",  //no i18n
        ":razz:": "zomoji-w-24-razz",  //no i18n
        ":relaxed:": "zomoji-w-24-relaxed",  //no i18n
        ":peace:": "zomoji-w-24-peace",  //no i18n
        ":yummy:": "zomoji-w-24-yummy",  //no i18n
        ":yuck:": "zomoji-w-24-yuck",  //no i18n
        ":sad:": "zomoji-w-24-sad",  //no i18n
        ":blush:": "zomoji-w-24-blush",  //no i18n
        ":upset:": "zomoji-w-24-upset",  //no i18n
        ":anxious:": "zomoji-w-24-anxious",  //no i18n
        ":worry:": "zomoji-w-24-worry",  //no i18n
        ":stressed-out:": "zomoji-w-24-stressed-out",  //no i18n
        ":angry:": "zomoji-w-24-angry",  //no i18n
        ":tensed:": "zomoji-w-24-tensed",  //no i18n
        ":tired:": "zomoji-w-24-tired",  //no i18n
        ":bored:": "zomoji-w-24-bored",  //no i18n
        ":sleepy:": "zomoji-w-24-sleepy",  //no i18n
        ":jealous:": "zomoji-w-24-jealous",  //no i18n
        ":evil:": "zomoji-w-24-evil",  //no i18n
        ":facepalm:": "zomoji-w-24-facepalm",  //no i18n
        ":doubt:": "zomoji-w-24-doubt",  //no i18n
        ":surprise:": "zomoji-w-24-surprise",  //no i18n
        ":faint:": "zomoji-w-24-faint",  //no i18n
        ":headache:": "zomoji-w-24-headache",  //no i18n
        ":sick:": "zomoji-w-24-sick",  //no i18n
        ":injured:": "zomoji-w-24-injured",  //no i18n
        ":neutral:": "zomoji-w-24-neutral",  //no i18n
        ":smirk:": "zomoji-w-24-smirk",  //no i18n
        ":keep-quiet:": "zomoji-w-24-keep-quiet",  //no i18n
        ":feeling-warm:": "zomoji-w-24-feeling-warm",  //no i18n
        ":feeling-cold:": "zomoji-w-24-feeling-cold",  //no i18n
        ":thumbsup:": "zomoji-w-24-thumbsup",  //no i18n
        ":thumbsdown:": "zomoji-w-24-thumbsdown",  //no i18n
        ":namaste:": "zomoji-w-24-namaste",  //no i18n
        ":super:": "zomoji-w-24-super",  //no i18n
        ":victory:": "zomoji-w-24-victory",  //no i18n
        ":yoyo:": "zomoji-w-24-yoyo",  //no i18n
        ":raising-hand:": "zomoji-w-24-raising-hand",  //no i18n
        ":clap:": "zomoji-w-24-clap",  //no i18n
        ":bye-bye:": "zomoji-w-24-bye-bye",  //no i18n
        ":fist:": "zomoji-w-24-fist",  //no i18n
        ":biceps:": "zomoji-w-24-biceps",  //no i18n
        ":flag:": "zomoji-w-24-flag",  //no i18n
        ":target:": "zomoji-w-24-target",  //no i18n
        ":foosball:": "zomoji-w-24-foosball",  //no i18n
        ":pingpong:": "zomoji-w-24-pingpong",  //no i18n
        ":coffee-cup:": "zomoji-w-24-coffee-cup",  //no i18n
        ":food:": "zomoji-w-24-food",  //no i18n
        ":chicken:": "zomoji-w-24-chicken",  //no i18n
        ":gift-box:": "zomoji-w-24-gift-box",  //no i18n
        ":champagne:": "zomoji-w-24-champagne",  //no i18n
        ":party:": "zomoji-w-24-party",  //no i18n
        ":poop:": "zomoji-w-24-poop",  //no i18n
        ":peanuts:": "zomoji-w-24-peanuts",  //no i18n
        ":birthday:": "zomoji-w-24-birthday",  //no i18n
        ":fireworks:": "zomoji-w-24-fireworks",  //no i18n
        ":christmas-tree:": "zomoji-w-24-christmas-tree",  //no i18n
        ":santa-hat:": "zomoji-w-24-santa-hat",  //no i18n
        ":eid-mubarak:": "zomoji-w-24-eid-mubarak",  //no i18n
        ":kaaba:": "zomoji-w-24-kaaba",  //no i18n
        ":new-year:": "zomoji-w-24-new-year",  //no i18n
        ":singing:": "zomoji-w-24-singing",  //no i18n
        ":break-boy:": "zomoji-w-24-break-boy",  //no i18n
        ":break-girl:": "zomoji-w-24-break-girl",  //no i18n
        ":woman-dancing:": "zomoji-w-24-woman-dancing",  //no i18n
        ":man-dancing:": "zomoji-w-24-man-dancing",  //no i18n
        ":yoga:": "zomoji-w-24-yoga",  //no i18n
        ":karate:": "zomoji-w-24-karate",  //no i18n
        ":medicine:": "zomoji-w-24-medicine",  //no i18n
        ":first-aid-box:": "zomoji-w-24-first-aid-box",  //no i18n
        ":fire-extinguisher:": "zomoji-w-24-fire-extinguisher",  //no i18n
        ":fire:": "zomoji-w-24-fire",  //no i18n
        ":man-cycling:": "zomoji-w-24-man-cycling",  //no i18n
        ":woman-cycling:": "zomoji-w-24-woman-cycling",  //no i18n
        ":woman-running:": "zomoji-w-24-woman-running",  //no i18n
        ":man-running:": "zomoji-w-24-man-running",  //no i18n
        ":man-swimming:": "zomoji-w-24-man-swimming",  //no i18n
        ":woman-swimming:": "zomoji-w-24-woman-swimming",  //no i18n
        ":football:": "zomoji-w-24-football",  //no i18n
        ":basketball:": "zomoji-w-24-basketball",  //no i18n
        ":volleyball:": "zomoji-w-24-volleyball",  //no i18n
        ":tennis:": "zomoji-w-24-tennis",  //no i18n
        ":badminton:": "zomoji-w-24-badminton",  //no i18n
        ":table-tennis:": "zomoji-w-24-table-tennis",  //no i18n
        ":cricket:": "zomoji-w-24-cricket",  //no i18n
        ":baseball:": "zomoji-w-24-baseball",  //no i18n
        ":hockey:": "zomoji-w-24-hockey",  //no i18n
        ":golf:": "zomoji-w-24-golf",  //no i18n
        ":snooker:": "zomoji-w-24-snooker",  //no i18n
        ":chess:": "zomoji-w-24-chess",  //no i18n
        ":football-player:": "zomoji-w-24-football-player",  //no i18n
        ":basketball-player:": "zomoji-w-24-basketball-player",  //no i18n
        ":male-volleyball-player:": "zomoji-w-24-male-volleyball-player",  //no i18n
        ":female-volleyball-player:": "zomoji-w-24-female-volleyball-player",  //no i18n
        ":female-tennis-player:": "zomoji-w-24-female-tennis-player",  //no i18n
        ":male-tennis-player:": "zomoji-w-24-male-tennis-player",  //no i18n
        ":badminton-player:": "zomoji-w-24-badminton-player",  //no i18n
        ":male-tabletennis-player:": "zomoji-w-24-male-tabletennis-player",  //no i18n
        ":female-tabletennis-player:": "zomoji-w-24-female-tabletennis-player",  //no i18n
        ":batsman:": "zomoji-w-24-batsman",  //no i18n
        ":bowler:": "zomoji-w-24-bowler",  //no i18n
        ":batter:": "zomoji-w-24-batter",  //no i18n
        ":pitcher:": "zomoji-w-24-pitcher",  //no i18n
        ":hockey-player:": "zomoji-w-24-hockey-player",  //no i18n
        ":golfer:": "zomoji-w-24-golfer",  //no i18n
        ":gymnast:": "zomoji-w-24-gymnast",  //no i18n
        ":snooker-player:": "zomoji-w-24-snooker-player",  //no i18n
        ":chess-player:": "zomoji-w-24-chess-player",  //no i18n
        ":gold-medal:": "zomoji-w-24-gold-medal",  //no i18n
        ":silver-medal:": "zomoji-w-24-silver-medal",  //no i18n
        ":bronze-medal:": "zomoji-w-24-bronze-medal",  //no i18n
        ":refugee-olympic-team:": "zomoji-w-24-refugee-olympic-team",  //no i18n
        ":athlete:": "zomoji-w-24-athlete",  //no i18n
        ":hurdler:": "zomoji-w-24-hurdler",  //no i18n
        ":high-jump:": "zomoji-w-24-high-jump",  //no i18n
        ":long-jump:": "zomoji-w-24-long-jump",  //no i18n
        ":pole-vault:": "zomoji-w-24-pole-vault",  //no i18n
        ":discus-throw:": "zomoji-w-24-discus-throw",  //no i18n
        ":hammer-throw:": "zomoji-w-24-hammer-throw",  //no i18n
        ":javelin-throw:": "zomoji-w-24-javelin-throw",  //no i18n
        ":shotput-throw:": "zomoji-w-24-shotput-throw",  //no i18n
        ":boxer:": "zomoji-w-24-boxer",  //no i18n
        ":fencer:": "zomoji-w-24-fencer",  //no i18n
        ":judo:": "zomoji-w-24-judo",  //no i18n
        ":weightlifting:": "zomoji-w-24-weightlifting",  //no i18n
        ":wrestling:": "zomoji-w-24-wrestling",  //no i18n
        ":archer:": "zomoji-w-24-archer",  //no i18n
        ":shooter:": "zomoji-w-24-shooter",  //no i18n
        ":equestrian:": "zomoji-w-24-equestrian",  //no i18n
        ":canoeing:": "zomoji-w-24-canoeing",  //no i18n
        ":diver:": "zomoji-w-24-diver",  //no i18n
        ":rhythmic-gymnastics:": "zomoji-w-24-rhythmic-gymnastics",  //no i18n
        ":bicycle:": "zomoji-w-24-bicycle",  //no i18n
        ":sports-bike:": "zomoji-w-24-sports-bike",  //no i18n
        ":cruiser-bike:": "zomoji-w-24-cruiser-bike",  //no i18n
        ":motor-scooter:": "zomoji-w-24-motor-scooter",  //no i18n
        ":car:": "zomoji-w-24-car",  //no i18n
        ":taxi:": "zomoji-w-24-taxi",  //no i18n
        ":bus:": "zomoji-w-24-bus",  //no i18n
        ":train:": "zomoji-w-24-train",  //no i18n
        ":police-car:": "zomoji-w-24-police-car",  //no i18n
        ":ambulance:": "zomoji-w-24-ambulance",  //no i18n
        ":fire-engine:": "zomoji-w-24-fire-engine",  //no i18n
        ":aeroplane:": "zomoji-w-24-aeroplane",  //no i18n
        ":passenger-ship:": "zomoji-w-24-passenger-ship",  //no i18n
        ":parking:": "zomoji-w-24-parking",  //no i18n
        ":cafeteria:": "zomoji-w-24-cafeteria",  //no i18n
        ":bug:": "zomoji-w-24-bug",  //no i18n
        ":milestone:": "zomoji-w-24-milestone",  //no i18n
        ":security:": "zomoji-w-24-security",  //no i18n
        ":calendar:": "zomoji-w-24-calendar",  //no i18n
        ":processor:": "zomoji-w-24-processor",  //no i18n
        ":laptop:": "zomoji-w-24-laptop",  //no i18n
        ":server:": "zomoji-w-24-server",  //no i18n
        ":garden:": "zomoji-w-24-garden",  //no i18n
        ":playground:": "zomoji-w-24-playground",  //no i18n
        ":home:": "zomoji-w-24-home",  //no i18n
        ":office:": "zomoji-w-24-office",  //no i18n
        ":library:": "zomoji-w-24-library",  //no i18n
        ":auditorium:": "zomoji-w-24-auditorium",  //no i18n
        ":store:": "zomoji-w-24-store",  //no i18n
        ":mail-room:": "zomoji-w-24-mail-room",  //no i18n
        ":pharmacy:": "zomoji-w-24-pharmacy",  //no i18n
        ":task:": "zomoji-w-24-task",  //no i18n
        ":report:": "zomoji-w-24-report",  //no i18n
        ":gym:": "zomoji-w-24-gym",  //no i18n
        ":americas:": "zomoji-w-24-americas",  //no i18n
        ":europe-africa:": "zomoji-w-24-europe-africa",  //no i18n
        ":asia-pacific:": "zomoji-w-24-asia-pacific",  //no i18n
        ":hi:": "zomoji-w-24-hi"   //no i18n
};

// var getUnicodeAndZomojiList = function(){
//     var addedEmojiList = [];
//     var emojiZomojiList = [];
//     Object.keys(emojiList).forEach(function(emojiName) {
//         let unicode = emojiList[emojiName];
//         let emoji = {
//             name : emojiName,
//             unicode : unicode
//         }
//         if(zomojiList[emojiName]){
//             emoji.className = zomojiList[emojiName];
//         }
//         emojiZomojiList.push(emoji);
//         addedEmojiList.push(emojiName);
//     });
//     Object.keys(zomojiList).forEach(function(zomojiName) {
//         if(addedEmojiList.indexOf(zomojiName) < 0){
//             let emoji = {
//                 name : emojiName,
//                 className : zomojiList[zomojiName]
//             }
//             emojiZomojiList.push(emoji);
//             addedEmojiList.push(zomojiName);
//         }
//     });
//     return emojiZomojiList;
// }

// export function getMatchedEmojiList(searchText) {
//     var matchedEmojiList = [];
//     var matchedEmojiNames = []; // caching this in order to find matched emoji names in simpler way
//     if(searchText) {
//         Object.keys(emojiList).forEach(function(emojiName) {
//             if (emojiName.includes(searchText)) {
//                 var emoji = {
//                     name: emojiName.slice(1, emojiName.length - 1),
//                     code: emojiList[emojiName].join('')
//                 };
//                 matchedEmojiList.push(emoji);
//                 matchedEmojiNames.push(emojiName);
//             }
//         });
//         Object.keys(shortcuts).forEach(function(shortcutCode) {
//             if (shortcutCode.includes(searchText)) {
//                 if (matchedEmojiNames.indexOf(shortcuts[shortcutCode]) < 0) {
//                     var emojiName = shortcuts[shortcutCode];
//                     var emoji = {
//                         name: emojiName.slice(1, emojiName.length - 1),
//                         code: emojiList[emojiName].join('')
//                     };
//                     matchedEmojiList.push(emoji);
//                 }
//             }
//         });
//     } else {
//         Object.keys(emojiList).forEach(function(emojiName) {
//             var emoji = {
//                 name: emojiName.slice(1, emojiName.length - 1),
//                 code: emojiList[emojiName].join('')
//             };
//             matchedEmojiList.push(emoji);
//         });
//     }
//     return matchedEmojiList;
// };

var getMatchedUnicodeList = function(searchText) {
    var matchedEmojiList = [];
    var matchedEmojiNames = []; // caching this in order to find matched emoji names in simpler way
    if(searchText) {
        for(let emojiName in emojiList){
            if (emojiName.includes(searchText)) {
                var emoji = {
                    name: getTrimmedEmojiName(emojiName),
                    code: emojiList[emojiName].join('')
                };
                matchedEmojiList.push(emoji);
                matchedEmojiNames.push(emojiName);
            }
        }
        for (let shortcutCode in shortcuts){
            if (shortcutCode.includes(searchText)) {
                let emojiName = shortcuts[shortcutCode];
                if (matchedEmojiNames.indexOf(emojiName) < 0 && emojiList[emojiName]) {
                    var emoji = {
                        name: getTrimmedEmojiName(emojiName),
                        code: emojiList[emojiName].join('')
                    };
                    matchedEmojiList.push(emoji);
                    matchedEmojiNames.push(emojiName);
                }
            }
        }
    } else {
        for(let emojiName in emojiList){
            var emoji = {
                name: getTrimmedEmojiName(emojiName),
                code: emojiList[emojiName].join('')
            };
            matchedEmojiList.push(emoji);
        };
    }
    return matchedEmojiList;
};

var getMatchedZomojiList = function(searchText) {
    var matchedZomojiList = [];
    var matchedZomojiNames = []; // caching this in order to find matched zomoji names in simpler way
    if(searchText) {
        for(let zomojiName in zomojiList){
            if (zomojiName.includes(searchText)) {
                var zomoji = {
                    name: getTrimmedEmojiName(zomojiName),
                    className: zomojiList[zomojiName]
                };
                matchedZomojiList.push(zomoji);
                matchedZomojiNames.push(zomojiName);
            }
        }
        for (let shortcutCode in shortcuts){
            if (shortcutCode.includes(searchText)) {
                let zomojiName = shortcuts[shortcutCode];
                if (matchedZomojiNames.indexOf(zomojiName) < 0 && zomojiList[zomojiName]) {
                    var zomoji = {
                        name: getTrimmedEmojiName(zomojiName),
                        className: zomojiList[zomojiName]
                    };
                    matchedZomojiList.push(zomoji);
                    matchedZomojiNames.push(zomojiName);
                }
            }
        }
    } else {
        for(let zomojiName in zomojiList){
            var zomoji = {
                name: zomojiName.slice(1, zomojiName.length - 1),
                className: zomojiList[zomojiName]
            };
            matchedZomojiList.push(zomoji);
        };
    }
    return matchedZomojiList;
}

export function getMatchedEmojiList(searchText, type){
    searchText = searchText.startsWith(':') ? searchText.slice(1) : searchText;
    searchText = searchText.endsWith(':') ? searchText.slice(0, -1) : searchText;
    if (type === 'UNICODE') {   //no i18n
        return { UNICODE: getMatchedUnicodeList(searchText) };
    } else if (type === 'ZOMOJI') { //no i18n
        return { ZOMOJI: getMatchedZomojiList(searchText) };
    } else {
        let unicodeList = getMatchedUnicodeList(searchText);
        let zomojiList = getMatchedZomojiList(searchText);
        return {
            UNICODE : unicodeList,
            ZOMOJI : zomojiList
        }
    }
}

export function getEmojiCode(name) {
    return emojiList[name];
};

export function getEmojiList(){
    return emojiList;
};

export function getShortCutList(){
    return shortcuts;
};

export function getZomojiList(){
    return zomojiList;
}

export function getTrimmedEmojiName(name){
    return name.slice(1, -1);
}
