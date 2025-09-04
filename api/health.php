<?php
// api/health.php - Backend Health Check

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

try {
    $response = [
        'status' => 'ok',
        'timestamp' => date('c'),
        'version' => '1.0.0',
        'services' => [
            'apache' => 'running',
            'php' => PHP_VERSION
        ],
        'resources' => [
            'memory_usage' => memory_get_usage(true),
            'memory_limit' => ini_get('memory_limit')
        ]
    ];
    
    http_response_code(200);
    echo json_encode($response, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    $response = [
        'status' => 'error',
        'timestamp' => date('c'),
        'message' => $e->getMessage(),
        'services' => [
            'apache' => 'running',
            'php' => PHP_VERSION
        ]
    ];
    
    http_response_code(500);
    echo json_encode($response, JSON_PRETTY_PRINT);
}
?>