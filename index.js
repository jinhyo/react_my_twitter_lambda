const AWS = require("aws-sdk");
const sharp = require("sharp");

const S3 = new AWS.s3();

exports.handler = async (event, context, callback) => {
  console.log("event", event);
  console.log("event.Records", event.Records);

  const Key = decodeURIComponent(event.Records[0].s3.object.key); // ex) images/12398743_flower.jsp
  // decodeURIComponent는 한글 문제 해결을 위해

  console.log("Key", Key);
  let ext = Key.split(".")[Key.split(".").length - 1].toLowerCase();
  if (ext === "gif") {
    return callback(null); // gif 파일은 리사이징 안됨
  } else if (ext === "jpg") {
    ext = "jpeg";
  }

  const Bucket = event.Records[0].s3.bucket.name; // 버킷명: jtwitter-images
  console.log("Bucket", Bucket);
  const filename = Key.split("/")[Key.split("/").length - 1];
  console.log("filename", filename);

  try {
    const S3Object = await S3.getObject({ Bucket, Key }).promise();
    console.log("S3Object.Body.length", S3Object.Body.length);
    console.log("S3Object.Body", S3Object.Body); // Body에 이미지들이 들어있음

    // 이미지 리사이징
    const resizedImage = await sharp(S3Object.Body)
      .resize(400, 400, { fit: "inside" })
      .toFormat(ext)
      .toBuffer();

    await S3.putObject({
      Bucket,
      Key: `thumb/${filename}`,
      Body: resizedImage
    }).promise();
    console.log("resizedImage.Body.length", resizedImage.Body.length);
    console.log("resizedImage.length", resizedImage.length);

    return callback(null, `thumb/${filename}`);
  } catch (error) {
    console.error(error);
    return callback(error);
  }
};
