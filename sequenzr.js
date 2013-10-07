var dropArea = $('sequenzr');

var isJpg = true; // Whether to save result in JPEG
var canvas = null; // Output canvas
var fileCount = 0; // Total file count
var bufCanvas = null; // Buffer Canvas for frame processing
var interval = 0; // Render result interval
var form = $('options'); // Form with options

// Drag & Drop
dropArea.ondragover = function () { this.className = 'hover'; return false; };
dropArea.ondragend = function () { this.className = ''; return false; };
dropArea.ondrop = function (e) {
  this.innerHTML = '<h2>Please wait...</h2>';
  this.className = '';
  e.preventDefault();

  // Sorting files by name
  var files = [];
  for (var i = 0; i < e.dataTransfer.files.length; i++)
  {
    files.push(e.dataTransfer.files[i]);
  }
  fileCount = files.length;
  files.sort(function(a, b) {
    return a.name > b.name ? 1 : -1;
  });

  // Processing files
  for (i = 0; i < files.length; i++)
  {
      var file = files[i];
      file.index = i;
      var reader = new FileReader();
      reader.onload = getFrameRenderer(file, i);
      reader.readAsDataURL(file);
  }

  return false;
};

// Frame Renderer
function getFrameRenderer(file, fileIndex)
{
    return function(evt) {
      var img = new Image();
      img.onload = function() {

        // Result canvas
        var canvas = getCanvas(img);
        var ctx = canvas.getContext('2d');

        // Buffer canvas for current frame
        var bufCanvas = getBufferCanvas(img);
        var bufCtx = bufCanvas.getContext('2d');

        // White Background
        if (isJpg || !form.transparency.checked)
        {
          ctx.fillStyle = '#fff';
          ctx.fillRect(fileIndex * img.width, 0, img.width, img.height);
        }

        // Frame
        bufCanvas.width = bufCanvas.width;
        bufCtx.drawImage(img, 0, 0);
        ctx.drawImage(bufCanvas, fileIndex * img.width, 0);

        // Frame: Alpha Channel
        if (form.alpha_channel.checked)
        {
          bufCanvas.width = bufCanvas.width;
          bufCtx.drawImage(img, 0, 0);
          var imgData = bufCtx.getImageData(0, 0, img.width, img.height);
          for (var i = 0; i < imgData.data.length; i+=4)
          {
              imgData.data[i] = imgData.data[i + 3];
              imgData.data[i + 1] = imgData.data[i + 3];
              imgData.data[i + 2] = imgData.data[i + 3];
              imgData.data[i + 3] = 255;
          }

          bufCtx.putImageData(imgData, 0, 0);

          ctx.fillStyle = '#000';
          ctx.fillRect(fileIndex * img.width, img.height, img.width, img.height);
          ctx.drawImage(bufCanvas, fileIndex * img.width, img.height);
        }

        // Output result image
        clearInterval(interval);
        interval = setTimeout(function() {
            var result = new Image();
            result.width = canvas.width;
            result.height = canvas.height;
            if (isJpg)
            {
              result.src = canvas.toDataURL("image/jpeg", form.jpg_compr.value / 100);
            }
            else
            {
              result.src = canvas.toDataURL("image/png");
            }
			
			dropArea.innerHTML = '';
            dropArea.appendChild(result);
			
			dropArea.appendChild(document.createElement('br'));
			
			var oneMore = document.createElement('a');
			oneMore.href = document.location;
			oneMore.innerHTML = 'one more?';
			dropArea.appendChild(oneMore);						
			dropArea.ondrop = null;
        }, 300);
      };

      img.src = evt.target.result;
  };
}

function getCanvas(img)
{
    if (!canvas)
    {
        canvas = document.createElement('canvas');
        canvas.width = img.width * fileCount;
        if (form.alpha_channel.checked)
        {
          canvas.height = img.height * 2;
        }
        else
        {
          canvas.height = img.height;
        }
    }

    return canvas;
}

function getBufferCanvas(img)
{
    if (!bufCanvas)
    {
        bufCanvas = document.createElement('canvas');
        bufCanvas.width = img.width;
        bufCanvas.height = img.height;
    }

    return bufCanvas;
}

// Options Form
function initForm()
{
  form.format[0].onchange = form.format[1].onchange = function() {
    isJpg = form.format[0].checked;
    $('png-options').style.display = !isJpg ? 'block' : 'none';
    $('jpg-options').style.display = isJpg ? 'block' : 'none';
    preview();
  };
  form.alpha_channel.onclick = preview;
  form.transparency.onclick = preview;
}

function preview()
{
  var filename = 'images/';

  // Alpha Channel
  if (!form.alpha_channel.checked) {
    filename += 'no';
  }
  filename += 'alpha';

  // Transparency
  if (!isJpg) {
    filename += '-';
    if (!form.transparency.checked) {
      filename += 'no';
    }
    filename += 'transparency';
  }
  
  // Format
  filename += isJpg ? '.jpg' : '.png';

  $('preview').src = filename;
}

function $(id)
{
  return document.getElementById(id);
}

initForm();