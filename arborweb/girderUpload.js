/*jslint browser: true, nomen: true */
/*globals $ */

function girderUpload(data, name, folder) {
    "use strict";
    var startByte;

    /**
     * Reads and uploads a chunk of the file starting at startByte. Pass
     * the uploadId generated in _uploadNextFile.
     */
    function uploadChunk(uploadId) {
        var endByte = Math.min(startByte + 1024 * 1024 * 64, data.size),
            // chunkLength = endByte - startByte,
            blob = data.slice(startByte, endByte),
            fd = new FormData();

        fd.append('offset', startByte);
        fd.append('uploadId', uploadId);
        fd.append('chunk', blob);

        $.ajax({
            url: '/girder/api/v1//file/chunk',
            type: 'POST',
            dataType: 'json',
            data: fd,
            contentType: false,
            processData: false,
            success: function () {
                // overallProgress += endByte - startByte;
                if (endByte !== data.size) {
                    startByte = endByte;
                    uploadChunk(uploadId);
                }
            }
            // error: function (xhr) {
            //     var text = 'Error: ';

            //     if (xhr.status === 0) {
            //         text += 'Connection to the server interrupted.';
            //     } else {
            //         text += xhr.responseJSON.message;
            //     }
            //     text += ' <a class="g-resume-upload">' +
            //         'Click to resume upload</a>';
            //     $('.g-upload-error-message').html(text);
            //     resumeUploadId = uploadId;
            // },
            // xhr: function () {
            //     // Custom XHR so we can register a progress handler
            //     var xhr = new window.XMLHttpRequest();
            //     xhr.upload.addEventListener('progress', function (e) {
            //         uploadProgress(e);
            //     });
            //     return xhr;
            // }
        });
    }

    /**
     * Progress callback from XHR during upload. This will update the bar
     * and the text accordingly.
     */
    // function uploadProgress(e) {
    //     if (!e.lengthComputable) {
    //         return;
    //     }

    //     // We only want to count bytes of the actual file, not the bytes of
    //     // the request body corresponding to the other form parameters that
    //     // we are also sending.
    //     var loaded = chunkLength + e.loaded - e.total;

    //     if (loaded < 0) {
    //         return;
    //     }

    //     $('.g-progress-current>.progress-bar').css('width',
    //         Math.ceil(100 * (this.startByte + loaded) / file.size) + '%');
    //     $('.g-progress-overall>.progress-bar').css('width',
    //         Math.ceil(100 * (this.overallProgress + loaded) / this.totalSize) +
    //         '%');
    //     $('.g-current-progress-message').html(
    //         '<i class="icon-doc-text"/>' + (this.currentIndex + 1) + ' of ' +
    //         this.files.length + ' - <b>' + file.name + '</b>: ' +
    //         girder.formatSize(this.startByte + loaded) + ' / ' +
    //         girder.formatSize(file.size));
    //     $('.g-overall-progress-message').html('Overall progress: ' +
    //         girder.formatSize(this.overallProgress + loaded) + ' / ' +
    //         girder.formatSize(this.totalSize));
    // }

    // Authenticate and generate the upload token for this file
    $.ajax({
        url: '/girder/api/v1/file',
        dataType: 'json',
        type: 'POST',
        data: {
            'parentType': 'folder',
            'parentId': folder,
            'name': name,
            'size': data.size,
            'mimeType': "text/plain"
        },
        success: function (upload) {
            if (data.size > 0) {
                // Begin uploading chunks of this file
                startByte = 0;
                uploadChunk(upload._id);
            }
        }
    });
}
