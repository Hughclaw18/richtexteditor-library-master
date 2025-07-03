// The getEmbedVdoUrls() function is copy pasted from connect editor's source code , this piece of code gets executed when the "done" button is clicked in the dialog box which pops up when we click insert embed icon in connect editor, only the necessary obects within the array in the function getEmbedVdoUrls() is kept rest all are deleted.

// The embed url given by the user needs to be pre-processed before setting it as src for the iframe tag
// The sample test cases for how all it is done is given below

// Sample test case 1:
// Input: https://www.youtu.be/H_bB0sAqLNg or https://www.youtube.com/watch?v=H_bB0sAqLNg
// Output: https://www.youtube.com/embed/H_bB0sAqLNg

// Sample test case 2:
// Input: https://www.youtube.com/embed/H_bB0sAqLNg
// Output: https://www.youtube.com/embed/H_bB0sAqLNg

// Sample test case 3:
// Input: https://www.dailymotion.com/video/x8iqeoo or https://dai.ly/x8iqeoo
// Output: https://www.dailymotion.com/embed/video/x8iqeoo

// Sample test case 4:
// Input: https://vimeo.com/757366077
// Output: https://player.vimeo.com/video/757366077

// Sample test case 5:
// Input: https://player.vimeo.com/external/392040372.hd.mp4?s=1675468c44692b5d9eae60ac813aab887d3b4620&profile_id=174&oauth2_token_id=57447761
// Output: https://player.vimeo.com/external/392040372.hd.mp4?s=1675468c44692b5d9eae60ac813aab887d3b4620&profile_id=174&oauth2_token_id=57447761

// Sample test case 6:
// Input: https://drive.google.com/file/d/1xEBMdo35R/view
// Output:https://drive.google.com/file/d/1xEBMdo35R/preview

// We have ignored the w and h values in each object as of now because we have set the width to be 80% by default.

export function getEmbedVdoUrls() {
    return [{
        regex: /^https?:\/\/(www\.)?youtu\.be\/([\w\-.]+)/,
        w: 560,
        h: 315,
        url: "https://www.youtube.com/embed/$2"
    }, {
        regex: /^https?:\/\/(www\.)?youtube\.com(.+)v=([^&]+)/,
        w: 560,
        h: 315,
        url: "https://www.youtube.com/embed/$3"
    }, {
        regex: /^https?:\/\/(www\.)?youtube.com\/embed\/([a-z0-9\-_]+(?:\?.+)?)/i,
        w: 560,
        h: 315,
        url: "https://www.youtube.com/embed/$2"
    }, {
        regex: /^https?:\/\/(www\.)?vimeo\.com\/([0-9]+)/,
        w: 480,
        h: 270,
        url: "https://player.vimeo.com/video/$2?title=0&byline=0&portrait=0&color=8dc7dc&dnt=1"
    }, {
        regex: /^https?:\/\/(www\.)?vimeo\.com\/(.*)\/([0-9]+)/,
        w: 480,
        h: 270,
        url: "https://player.vimeo.com/video/$3?title=0&amp;byline=0&amp;dnt=1"
    }, {
        regex: /^https?:\/\/drive.google\.com\/file\/d\/([^\/]+)\/(pre)?view/,
        w: 425,
        h: 350,
        url: "https://drive.google.com/file/d/$1/preview"
    }, {
        regex: /^https?:\/\/(www\.)?dailymotion\.com\/video\/([^_]+)/,
        w: 480,
        h: 270,
        url: "https://www.dailymotion.com/embed/video/$2"
    }, {
        regex: /^https?:\/\/(www\.)?dai\.ly\/([^\/]+)/,
        w: 480,
        h: 270,
        url: "https://www.dailymotion.com/embed/video/$2"
    }]
}