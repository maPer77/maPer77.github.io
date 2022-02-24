  export default async function getExifThumb(file) {
    if (file.type !== "image/jpeg") { 
      return {ok:false, thumbFound:false, statusText:'Invalid image/jpeg', fileName:file.name}; 
    };

    let responseThumbSizes = {};
    const responseThumb = await getThumbFind(file);

    if (responseThumb.ok) {
      responseThumbSizes = await getThumbSize(responseThumb.src);
    }
    
    return {...responseThumb, ...responseThumbSizes};
  } //getExifThumb


  function getThumbFind(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file.slice(0, 50000));
      reader.onload = (fileSlice)=>{
        const response = findBlob(fileSlice, file.name);
        resolve(response);
      };
    });
  } //getThumbFind


  function findBlob(filePart, fileName) {
    const array = new Uint8Array(filePart.target.result);
    let start, end;
    [start, end] = findStartEnd(array);

    if (start && end) {

      const urlCreator = window.URL || window.webkitURL;
      const thumb = new Blob([array.subarray(start, end)], {type:"image/jpeg"});
      const imageBlobUrl = urlCreator.createObjectURL(thumb);
      return {ok:true, thumbFound:true, statusText:'ok', src:imageBlobUrl, fileName:fileName, start:start, end:end};

    } else {

      return {ok:true, thumbFound:false, statusText:'Thumbnail not found!', src:'', fileName:fileName, start:start, end:end};

    }
  } //findBlob


  function findStartEnd(array) {
    let start = false, end = false;
    const x = array.length;
    for (let i = 2; i < x; ++i) {

      if ( array[i] !== 0xFF ) continue; // 0xFF / 255 

      if ( array[i + 1] === 0xD8 ) { // 0xD8 / 216
        start = i;

      } else if ( start && array[i + 1] === 0xD9 ) { // 0xD9 / 217
        end = i + 2 ;
        break;
      }

    } //endFor
    return [start, end];
  } //findStartEnd


  function getThumbSize(blobImg) {
    return new Promise((resolve) => {
      let width, height;
      let img = new Image();
      img.src = blobImg;
      img.onload = function() {
        width = this.width;
        height = this.height;
        resolve({width: width, height: height});
      }
      img.onerror = function(error) { 
        resolve({ok:true, thumbFound:false, statusText: 'Thumbnail not found!'});
      }
    });
  } // getThumbSizes