define('modules/ajaximgupload', [
    'jquery',
    'underscore'

], function($, _) {
    var aiu = {};

    aiu.init = function() {
        $(document).ready(function() {
            $('#inputFile').on('change', function() {
                var val = $(this).val();
                if (val === '') return true;

                var form = $('#aUploadImageForm');
                var formData = new FormData($(form)[0]);
                var timestamp = new Date().getTime();
                var imgSrc = form.find('img').attr('src') + '?' + timestamp;
                $.ajax({
                    url: '/accounts/uploadImage',
                    type: 'POST',
                    data: formData,
                    async: false,
                    cache: false,
                    contentType: false,
                    processData: false,
                    success: function(data) {
                        form.find('img').attr('src', data + '?' + timestamp);
                    },
                    error: function(err) {
                        console.log(err);
                    }
                });

                $(this).val('');
            });


        });
    };

    return aiu;
});